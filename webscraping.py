import asyncio
import logging
from datetime import datetime, timedelta, timezone
from math import radians, cos, sin, asin, sqrt
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import re
from functools import lru_cache
from contextlib import asynccontextmanager
import time
from dataclasses import dataclass
import hashlib
import uuid

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator, Field
import uvicorn
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('water_hazards.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration class for better config management
@dataclass(frozen=True)
class Config:
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "")
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    MAX_RADIUS_KM: int = 80
    TIME_WINDOW_DAYS: int = 5
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    RATE_LIMIT_PER_MINUTE: int = 60
    
    def __post_init__(self):
        missing_keys = []
        if not self.NASA_API_KEY:
            missing_keys.append("NASA_API_KEY")
        if not self.NEWS_API_KEY:
            missing_keys.append("NEWS_API_KEY")
        if not self.SUPABASE_URL:
            missing_keys.append("SUPABASE_URL")
        if not self.SUPABASE_SERVICE_KEY:
            missing_keys.append("SUPABASE_SERVICE_KEY")
        
        if missing_keys:
            logger.warning(f"Missing environment variables: {', '.join(missing_keys)}")

config = Config()

# Global Supabase client
supabase: Client = None

# Rate limiting and caching
request_counts: Dict[str, List[float]] = {}

def check_rate_limit(user_id: str) -> bool:
    """Simple in-memory rate limiting"""
    current_time = time.time()
    if user_id not in request_counts:
        request_counts[user_id] = []
    
    # Clean old requests (older than 1 minute)
    request_counts[user_id] = [
        req_time for req_time in request_counts[user_id] 
        if current_time - req_time < 60
    ]
    
    if len(request_counts[user_id]) >= config.RATE_LIMIT_PER_MINUTE:
        return False
    
    request_counts[user_id].append(current_time)
    return True

# Enhanced water hazard types with confidence scoring
WATER_HAZARD_TYPES = {
    "flood": {
        "keywords": ["flood", "flooding", "inundation", "deluge", "overflow"],
        "confidence_boost": ["severe flood", "flash flood", "urban flood"]
    },
    "tsunami": {
        "keywords": ["tsunami", "tidal wave", "seismic sea wave"],
        "confidence_boost": ["tsunami warning", "tsunami alert"]
    },
    "severeStorm": {
        "keywords": ["cyclone", "hurricane", "typhoon", "severe storm", "tropical storm"],
        "confidence_boost": ["category", "wind speed", "landfall"]
    },
    "stormSurge": {
        "keywords": ["storm surge", "coastal flooding", "surge warning"],
        "confidence_boost": ["surge height", "coastal evacuation"]
    },
    "heavyRain": {
        "keywords": ["heavy rain", "torrential rain", "monsoon", "downpour"],
        "confidence_boost": ["rainfall warning", "precipitation"]
    }
}

# Enhanced coastal states with coordinates for better detection
INDIAN_COASTAL_REGIONS = {
    "andhra pradesh": {"lat_range": (12.6, 19.9), "lon_range": (76.8, 84.8)},
    "goa": {"lat_range": (14.9, 15.8), "lon_range": (73.7, 74.3)},
    "gujarat": {"lat_range": (20.1, 24.7), "lon_range": (68.2, 74.4)},
    "karnataka": {"lat_range": (11.3, 18.5), "lon_range": (74.1, 78.6)},
    "kerala": {"lat_range": (8.2, 12.8), "lon_range": (74.9, 77.4)},
    "maharashtra": {"lat_range": (15.6, 22.0), "lon_range": (72.6, 80.9)},
    "odisha": {"lat_range": (17.8, 22.6), "lon_range": (81.3, 87.5)},
    "tamil nadu": {"lat_range": (8.1, 13.6), "lon_range": (76.2, 80.3)},
    "west bengal": {"lat_range": (21.5, 27.2), "lon_range": (85.8, 89.9)}
}

# Enhanced Pydantic models
class HazardRequest(BaseModel):
    user_email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$', description="Valid email address")
    user_id: str = Field(..., min_length=1, max_length=100, description="Unique user identifier")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    hazard_type: Optional[str] = Field(None, description="Optional hazard type filter")
    
    @validator('hazard_type')
    def validate_hazard_type(cls, v):
        if v and v not in WATER_HAZARD_TYPES.keys():
            raise ValueError(f'Hazard type must be one of: {list(WATER_HAZARD_TYPES.keys())}')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "user_email": "user@example.com",
                "user_id": "user_123",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "hazard_type": "flood"
            }
        }

class HazardEvent(BaseModel):
    source: str = Field(..., description="Data source name")
    title: str = Field(..., min_length=1, max_length=500, description="Event title")
    description: str = Field(..., description="Event description")
    hazard_type: str = Field(..., description="Type of water hazard")
    event_time: datetime = Field(..., description="Event timestamp")
    url: str = Field(..., description="Source URL")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Event latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Event longitude")
    confidence_score: float = Field(default=0.5, ge=0, le=1, description="Confidence in classification")
    distance_km: Optional[float] = Field(None, ge=0, description="Distance from user location in km")
    event_unique_id: Optional[str] = Field(None, description="Unique identifier for the event")
    location_name: Optional[str] = Field(None, description="Human-readable location name")
    
    class Config:
        schema_extra = {
            "example": {
                "source": "NASA",
                "title": "Flood Event in Chennai",
                "description": "Severe flooding reported in Chennai due to heavy rainfall",
                "hazard_type": "flood",
                "event_time": "2025-09-23T10:30:00Z",
                "url": "https://example.com/event/123",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "confidence_score": 0.85,
                "distance_km": 15.2,
                "event_unique_id": "nasa_flood_chennai_2025_09_23",
                "location_name": "Chennai, Tamil Nadu, India"
            }
        }

class APIResponse(BaseModel):
    success: bool
    data: List[HazardEvent]
    metadata: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global supabase
    logger.info("Starting Water Hazards API with Supabase integration...")
    
    # Initialize Supabase client
    try:
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
            raise ValueError("Supabase configuration missing")
        
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
        
        # Test connection
        test_result = supabase.table("users").select("id").limit(1).execute()
        logger.info("Supabase client initialized and tested successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize Supabase: {e}")
        raise RuntimeError(f"Supabase initialization failed: {e}")
    
    yield
    # Shutdown
    logger.info("Shutting down Water Hazards API...")

# Initialize FastAPI app
app = FastAPI(
    title="Water-Related Disaster & Hazard Information API",
    description="Enterprise-grade API for aggregating real-time water-related disaster information with Supabase storage",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    responses={
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"},
        503: {"description": "Service temporarily unavailable"}
    }
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure for production
)

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

# Supabase integration functions
def generate_unique_event_id(source: str, title: str, url: str, event_time: datetime) -> str:
    """Generate a unique ID for an event to prevent duplicates"""
    content = f"{source}:{title}:{url}:{event_time.isoformat()}"
    return hashlib.sha256(content.encode()).hexdigest()[:32]

async def get_or_create_user(user_email: str, user_id: str) -> Optional[str]:
    """Get or create user in Supabase and return their UUID"""
    try:
        # First, try to find existing user by email
        result = supabase.table("users").select("id, name").eq("email", user_email).execute()
        
        if result.data:
            existing_user = result.data[0]
            user_uuid = existing_user["id"]
            logger.info(f"Found existing user: {user_email} -> UUID: {user_uuid}")
            
            # Update name if different
            if existing_user.get('name') != user_id:
                supabase.table("users").update({"name": user_id}).eq("id", user_uuid).execute()
                logger.info(f"Updated user name to: {user_id}")
            
            return user_uuid
        
        # Create new user if not found
        user_data = {
            "name": user_id,
            "email": user_email,
            "role": "citizen"
        }
        
        logger.info(f"Creating new user: {user_email}")
        insert_result = supabase.table("users").insert(user_data).execute()
        
        if insert_result.data:
            new_user_uuid = insert_result.data[0]["id"]
            logger.info(f"Successfully created user: {user_email} -> UUID: {new_user_uuid}")
            return new_user_uuid
        
        logger.error(f"Failed to create user: {user_email}")
        return None
            
    except Exception as e:
        logger.error(f"Error handling user {user_email}: {e}")
        
        # Handle race conditions for duplicate users
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            try:
                retry_result = supabase.table("users").select("id").eq("email", user_email).execute()
                if retry_result.data:
                    return retry_result.data[0]["id"]
            except Exception as retry_e:
                logger.error(f"Error in retry fetch for {user_email}: {retry_e}")
        
        return None

async def store_hazard_event(event: HazardEvent, user_uuid: str, user_lat: float, user_lon: float, location_name: str = None) -> bool:
    """Store a hazard event and create user discovery record with all event details"""
    try:
        # Generate unique event ID
        event_unique_id = generate_unique_event_id(
            event.source, event.title, event.url, event.event_time
        )
        
        # First, store in hazard_events table
        event_data = {
            "source": event.source,
            "title": event.title,
            "description": event.description,
            "hazard_type": event.hazard_type,
            "event_time": event.event_time.isoformat(),
            "url": event.url,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "confidence_score": event.confidence_score,
            "event_unique_id": event_unique_id
        }
        
        # Insert/update event (upsert prevents duplicates)
        event_result = supabase.table("hazard_events").upsert(
            event_data, 
            on_conflict="event_unique_id"
        ).execute()
        
        if not event_result.data:
            logger.error(f"Failed to store event: {event_unique_id}")
            return False
        
        event_db_id = event_result.data[0]['id']
        
        # Create comprehensive user discovery record with all event details
        discovery_data = {
            "user_id": user_uuid,
            "event_id": event_db_id,
            "title": event.title,
            "description": event.description,
            "hazard_type": event.hazard_type,
            "url": event.url,
            "event_time": event.event_time.isoformat(),
            "source": event.source,
            "confidence_score": event.confidence_score,
            "event_latitude": event.latitude,
            "event_longitude": event.longitude,
            "location_name": location_name or event.location_name,
            "user_latitude": user_lat,
            "user_longitude": user_lon,
            "distance_km": event.distance_km
        }
        
        # Use upsert to prevent duplicate discoveries
        discovery_result = supabase.table("user_discoveries").upsert(
            discovery_data,
            on_conflict="user_id,event_id"
        ).execute()
        
        if discovery_result.data:
            logger.info(f"Successfully stored event and discovery record: {event_unique_id}")
            return True
        else:
            logger.warning(f"Event stored but discovery record failed: {event_unique_id}")
            return True  # Event is stored, which is the main goal
            
    except Exception as e:
        logger.error(f"Error storing hazard event: {e}")
        return False

async def store_events_batch(events: List[HazardEvent], user_email: str, user_id: str, user_lat: float, user_lon: float, location_name: str = None) -> Dict[str, int]:
    """Store multiple events efficiently"""
    stored_count = 0
    failed_count = 0
    
    # Get or create user
    user_uuid = await get_or_create_user(user_email, user_id)
    if not user_uuid:
        logger.error(f"Cannot store events - user creation failed for {user_email}")
        return {"stored": 0, "failed": len(events)}
    
    logger.info(f"Storing batch of {len(events)} events for user: {user_email}")
    
    # Store each event
    for event in events:
        if await store_hazard_event(event, user_uuid, user_lat, user_lon, location_name):
            stored_count += 1
        else:
            failed_count += 1
    
    logger.info(f"Batch storage complete - Stored: {stored_count}, Failed: {failed_count}")
    return {"stored": stored_count, "failed": failed_count}

async def get_cached_events_from_discoveries(latitude: float, longitude: float, radius_km: int = 80, hazard_type: Optional[str] = None) -> List[HazardEvent]:
    """Retrieve recent events from user_discoveries table (faster for frontend)"""
    try:
        query = supabase.table("user_discoveries").select("*")
        
        # Add hazard type filter
        if hazard_type:
            query = query.eq("hazard_type", hazard_type)
        
        # Add time window filter
        time_threshold = datetime.now(timezone.utc) - timedelta(days=config.TIME_WINDOW_DAYS)
        query = query.gte("event_time", time_threshold.isoformat())
        
        # Order and limit
        query = query.order("confidence_score", desc=True).order("discovered_at", desc=True).limit(100)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        # Convert to HazardEvent objects and filter by distance
        events = []
        seen_event_ids = set()  # Prevent duplicates from multiple users discovering same event
        
        for row in result.data:
            # Skip if we've already processed this event
            if row["event_id"] in seen_event_ids:
                continue
            
            # Calculate distance if coordinates available
            distance = None
            if row.get("event_latitude") and row.get("event_longitude"):
                distance = calculate_distance(
                    latitude, longitude, 
                    float(row["event_latitude"]), float(row["event_longitude"])
                )
                if distance > radius_km:
                    continue
            
            seen_event_ids.add(row["event_id"])
            
            event = HazardEvent(
                source=row["source"],
                title=row["title"],
                description=row["description"],
                hazard_type=row["hazard_type"],
                event_time=datetime.fromisoformat(row["event_time"]),
                url=row["url"],
                latitude=row.get("event_latitude"),
                longitude=row.get("event_longitude"),
                confidence_score=row.get("confidence_score", 0.5),
                distance_km=distance,
                event_unique_id=f"{row['source']}_{row['event_id']}",  # Generate for compatibility
                location_name=row.get("location_name")
            )
            events.append(event)
        
        return events
        
    except Exception as e:
        logger.error(f"Error retrieving cached events from discoveries: {e}")
        return []

async def get_cached_events(latitude: float, longitude: float, radius_km: int = 80, hazard_type: Optional[str] = None) -> List[HazardEvent]:
    """Retrieve recent events from Supabase cache - keeping original function for backward compatibility"""
    try:
        query = supabase.table("hazard_events").select("*")
        
        # Add hazard type filter
        if hazard_type:
            query = query.eq("hazard_type", hazard_type)
        
        # Add time window filter
        time_threshold = datetime.now(timezone.utc) - timedelta(days=config.TIME_WINDOW_DAYS)
        query = query.gte("event_time", time_threshold.isoformat())
        
        # Order and limit
        query = query.order("confidence_score", desc=True).order("event_time", desc=True).limit(100)
        
        result = query.execute()
        
        if not result.data:
            return []
        
        # Convert to HazardEvent objects and filter by distance
        events = []
        for row in result.data:
            # Calculate distance if coordinates available
            distance = None
            if row.get("latitude") and row.get("longitude"):
                distance = calculate_distance(
                    latitude, longitude, 
                    float(row["latitude"]), float(row["longitude"])
                )
                if distance > radius_km:
                    continue
            
            event = HazardEvent(
                source=row["source"],
                title=row["title"],
                description=row["description"],
                hazard_type=row["hazard_type"],
                event_time=datetime.fromisoformat(row["event_time"]),
                url=row["url"],
                latitude=row.get("latitude"),
                longitude=row.get("longitude"),
                confidence_score=row.get("confidence_score", 0.5),
                distance_km=distance,
                event_unique_id=row["event_unique_id"]
            )
            events.append(event)
        
        return events
        
    except Exception as e:
        logger.error(f"Error retrieving cached events: {e}")
        return []

# Enhanced helper functions
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points using Haversine formula."""
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(min(1.0, a)))
    
    return 6371 * c

_reverse_geocode_cache: Dict[str, tuple] = {}

async def reverse_geocode_cached(latitude: float, longitude: float) -> tuple:
    """Async cache for reverse geocoding"""
    key = f"{latitude},{longitude}"
    if key in _reverse_geocode_cache:
        return _reverse_geocode_cache[key]
    result = await reverse_geocode(latitude, longitude)
    _reverse_geocode_cache[key] = result
    return result

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(httpx.TimeoutException)
)
async def reverse_geocode(latitude: float, longitude: float) -> tuple:
    """Enhanced reverse geocoding with retry logic and better coastal detection."""
    try:
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(
                "https://api.bigdatacloud.net/data/reverse-geocode-client",
                params={
                    "latitude": latitude, 
                    "longitude": longitude, 
                    "localityLanguage": "en"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                city = data.get('city', '')
                region = data.get('principalSubdivision', '').lower()
                country = data.get('countryName', '').lower()
                
                location_str = f"{city} {region} {country}".strip()
                
                # Enhanced coastal detection using coordinates
                is_coastal = False
                if country == 'india':
                    for state, coords in INDIAN_COASTAL_REGIONS.items():
                        if (state in region and 
                            coords["lat_range"][0] <= latitude <= coords["lat_range"][1] and
                            coords["lon_range"][0] <= longitude <= coords["lon_range"][1]):
                            is_coastal = True
                            break
                
                logger.info(f"Reverse geocode successful: {location_str}")
                return location_str, is_coastal
                
    except Exception as e:
        logger.error(f"Reverse geocoding failed: {e}")
    
    return f"{latitude},{longitude}", False

def is_within_time_window(event_time: datetime, days: int = None) -> bool:
    """Enhanced time window checking with timezone awareness"""
    days = days or config.TIME_WINDOW_DAYS
    
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    time_threshold = now - timedelta(days=days)
    return event_time >= time_threshold

def classify_water_hazard_enhanced(text: str, specified_type: Optional[str] = None) -> tuple[str, float]:
    """Enhanced hazard classification with confidence scoring."""
    text_lower = text.lower()
    best_match = "other"
    max_confidence = 0.0
    
    for hazard_type, config_data in WATER_HAZARD_TYPES.items():
        confidence = 0.0
        
        # Check basic keywords
        keyword_matches = sum(1 for keyword in config_data["keywords"] if keyword in text_lower)
        if keyword_matches > 0:
            confidence = min(0.7, keyword_matches * 0.2)
        
        # Boost confidence for high-confidence keywords
        boost_matches = sum(1 for boost_keyword in config_data["confidence_boost"] if boost_keyword in text_lower)
        confidence += min(0.3, boost_matches * 0.15)
        
        # If specified type matches and has some confidence, prioritize it
        if specified_type == hazard_type and confidence > 0.1:
            confidence += 0.2
        
        if confidence > max_confidence:
            max_confidence = confidence
            best_match = hazard_type
    
    return best_match, max_confidence

# Enhanced data source functions (keeping your existing fetch functions)
@retry(
    stop=stop_after_attempt(config.MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPError))
)
async def fetch_nasa_eonet_data(latitude: float, longitude: float, hazard_type: Optional[str] = None) -> List[HazardEvent]:
    """Enhanced NASA EONET data fetching with retry logic"""
    events = []
    start_time = time.time()
    
    try:
        start_date = (datetime.now() - timedelta(days=config.TIME_WINDOW_DAYS)).strftime('%Y-%m-%d')
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            url = "https://eonet.gsfc.nasa.gov/api/v3/events"
            params = {
                "status": "open",
                "start": start_date,
                "limit": 100
            }
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            for event in data.get("events", []):
                event_id = event.get("id")
                title = event.get("title", "")
                description = event.get("description", "")
                
                categories = event.get("categories", [])
                if not categories:
                    continue
                
                category_title = categories[0].get("title", "").lower()
                
                # Enhanced classification with confidence
                detected_hazard, confidence = classify_water_hazard_enhanced(
                    f"{title} {description} {category_title}", hazard_type
                )
                
                if detected_hazard == "other" or confidence < 0.3:
                    continue
                
                if hazard_type and detected_hazard != hazard_type:
                    continue
                
                # Process geometries
                geometries = event.get("geometry", [])
                for geometry in geometries:
                    coordinates = geometry.get("coordinates", [])
                    if coordinates and len(coordinates) >= 2:
                        event_lon, event_lat = coordinates[0], coordinates[1]
                        
                        distance = calculate_distance(latitude, longitude, event_lat, event_lon)
                        if distance <= config.MAX_RADIUS_KM:
                            # Parse event date
                            event_time = datetime.now(timezone.utc)
                            if geometry.get("date"):
                                try:
                                    event_time = datetime.fromisoformat(geometry["date"].replace("Z", "+00:00"))
                                except:
                                    pass
                            
                            if is_within_time_window(event_time):
                                # Get location name for the event
                                location_name, _ = await reverse_geocode_cached(event_lat, event_lon)
                                
                                hazard_event = HazardEvent(
                                    source="NASA",
                                    title=title,
                                    description=description,
                                    hazard_type=detected_hazard,
                                    event_time=event_time,
                                    url=f"https://eonet.gsfc.nasa.gov/api/v3/events/{event_id}",
                                    latitude=event_lat,
                                    longitude=event_lon,
                                    confidence_score=confidence,
                                    distance_km=round(distance, 2),
                                    location_name=location_name
                                )
                                events.append(hazard_event)
                            break
    
    except Exception as e:
        logger.error(f"Error fetching NASA EONET data: {e}")
        raise
    
    finally:
        execution_time = time.time() - start_time
        logger.info(f"NASA EONET fetch completed in {execution_time:.2f}s, found {len(events)} events")
    
    return events

@retry(
    stop=stop_after_attempt(config.MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def fetch_news_api_data(latitude: float, longitude: float, hazard_type: Optional[str] = None) -> List[HazardEvent]:
    """Enhanced NewsAPI data fetching with better query construction"""
    events = []
    start_time = time.time()
    
    try:
        location, _ = await reverse_geocode_cached(latitude, longitude)
        
        # Enhanced query construction
        if hazard_type and hazard_type in WATER_HAZARD_TYPES:
            keywords = " OR ".join(WATER_HAZARD_TYPES[hazard_type]["keywords"])
        else:
            all_keywords = []
            for hazard_config in WATER_HAZARD_TYPES.values():
                all_keywords.extend(hazard_config["keywords"])
            keywords = " OR ".join(all_keywords[:12])
        
        from_date = (datetime.now() - timedelta(days=config.TIME_WINDOW_DAYS)).strftime('%Y-%m-%d')
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": f"({keywords}) AND {location}",
                "from": from_date,
                "language": "en",
                "sortBy": "publishedAt",
                "apiKey": config.NEWS_API_KEY,
                "pageSize": 50
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 429:
                logger.warning("NewsAPI rate limit exceeded")
                return events
            
            response.raise_for_status()
            data = response.json()
            
            for article in data.get("articles", []):
                title = article.get("title", "")
                description = article.get("description", "")
                url_link = article.get("url", "")
                published_at = article.get("publishedAt", "")
                
                try:
                    event_time = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                except:
                    event_time = datetime.now(timezone.utc)
                
                if not is_within_time_window(event_time):
                    continue
                
                content = f"{title} {description}"
                detected_hazard, confidence = classify_water_hazard_enhanced(content, hazard_type)
                
                if detected_hazard == "other" or confidence < 0.4:
                    continue
                
                if hazard_type and detected_hazard != hazard_type:
                    continue
                
                hazard_event = HazardEvent(
                    source="NewsAPI",
                    title=title,
                    description=description or "No description available",
                    hazard_type=detected_hazard,
                    event_time=event_time,
                    url=url_link,
                    latitude=latitude,
                    longitude=longitude,
                    confidence_score=confidence,
                    distance_km=0.0,
                    location_name=location
                )
                events.append(hazard_event)
    
    except Exception as e:
        logger.error(f"Error fetching NewsAPI data: {e}")
        raise
    
    finally:
        execution_time = time.time() - start_time
        logger.info(f"NewsAPI fetch completed in {execution_time:.2f}s, found {len(events)} events")
    
    return events

async def fetch_incois_data(latitude: float, longitude: float, hazard_type: Optional[str] = None) -> List[HazardEvent]:
    """Enhanced INCOIS data scraping with better parsing"""
    events = []
    start_time = time.time()
    
    try:
        location_name, is_coastal = await reverse_geocode_cached(latitude, longitude)
        if not is_coastal:
            logger.info("Location not in Indian coastal area, skipping INCOIS data")
            return events
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            # Enhanced tsunami bulletin scraping
            if not hazard_type or hazard_type == "tsunami":
                tsunami_events = await _scrape_tsunami_bulletins(client)
                for event in tsunami_events:
                    event.location_name = location_name
                events.extend(tsunami_events)
            
            # Enhanced storm surge warning scraping
            if not hazard_type or hazard_type in ["severeStorm", "stormSurge"]:
                storm_events = await _scrape_storm_surge_warnings(client)
                for event in storm_events:
                    event.location_name = location_name
                events.extend(storm_events)
    
    except Exception as e:
        logger.error(f"Error fetching INCOIS data: {e}")
    
    finally:
        execution_time = time.time() - start_time
        logger.info(f"INCOIS fetch completed in {execution_time:.2f}s, found {len(events)} events")
    
    return events

async def _scrape_tsunami_bulletins(client: httpx.AsyncClient) -> List[HazardEvent]:
    """Helper function to scrape tsunami bulletins"""
    events = []
    try:
        tsunami_url = "https://incois.gov.in/Tsunami_Warning_Centre/Indian_Ocean_Tsunami_Advisories.jsp"
        response = await client.get(tsunami_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 4:
                    try:
                        bulletin_no = cells[0].get_text(strip=True)
                        date_time_str = cells[1].get_text(strip=True)
                        affected_areas = cells[3].get_text(strip=True)
                        
                        event_time = _parse_incois_date(date_time_str)
                        
                        if not is_within_time_window(event_time):
                            continue
                        
                        if any(area.lower() in affected_areas.lower() for area in 
                              ["indian ocean", "india", "coast", "all", "bay of bengal", "arabian sea"]):
                            
                            hazard_event = HazardEvent(
                                source="INCOIS",
                                title=f"Tsunami Advisory - Bulletin {bulletin_no}",
                                description=f"Date/Time: {date_time_str}. Affected areas: {affected_areas}",
                                hazard_type="tsunami",
                                event_time=event_time,
                                url=tsunami_url,
                                latitude=None,
                                longitude=None,
                                confidence_score=0.9,
                                location_name="Indian Ocean Region"
                            )
                            events.append(hazard_event)
                    except Exception as e:
                        logger.error(f"Error parsing tsunami bulletin row: {e}")
                        continue
    except Exception as e:
        logger.error(f"Error scraping tsunami bulletins: {e}")
    
    return events

async def _scrape_storm_surge_warnings(client: httpx.AsyncClient) -> List[HazardEvent]:
    """Helper function to scrape storm surge warnings"""
    events = []
    try:
        storm_url = "https://incois.gov.in/portal/osf/storm_surge_warnings.jsp"
        response = await client.get(storm_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        warning_elements = soup.find_all(['div', 'p', 'span', 'td'])
        processed_texts = set()
        
        for element in warning_elements[:10]:
            warning_text = element.get_text(strip=True)
            
            if (len(warning_text) > 30 and 
                warning_text not in processed_texts and
                any(keyword in warning_text.lower() for keyword in 
                   ['storm surge', 'cyclone', 'warning', 'alert', 'surge'])):
                
                processed_texts.add(warning_text)
                event_time = _extract_date_from_text(warning_text)
                
                if not is_within_time_window(event_time):
                    continue
                
                hazard_event = HazardEvent(
                    source="INCOIS",
                    title="Storm Surge Warning",
                    description=warning_text[:400],
                    hazard_type="stormSurge",
                    event_time=event_time,
                    url=storm_url,
                    latitude=None,
                    longitude=None,
                    confidence_score=0.8,
                    location_name="Indian Coastal Region"
                )
                events.append(hazard_event)
                break
    except Exception as e:
        logger.error(f"Error scraping storm surge warnings: {e}")
    
    return events

def _parse_incois_date(date_str: str) -> datetime:
    """Enhanced date parsing for INCOIS data"""
    try:
        date_part = date_str.split()[0]
        return datetime.strptime(date_part, "%d/%m/%Y").replace(tzinfo=timezone.utc)
    except:
        return datetime.now(timezone.utc)

def _extract_date_from_text(text: str) -> datetime:
    """Extract date from warning text with multiple patterns"""
    date_patterns = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
        r'\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\b'
    ]
    
    for pattern in date_patterns:
        date_match = re.search(pattern, text, re.IGNORECASE)
        if date_match:
            try:
                date_str = date_match.group(1)
                if '/' in date_str or '-' in date_str:
                    return datetime.strptime(date_str, "%d/%m/%Y").replace(tzinfo=timezone.utc)
                else:
                    return datetime.strptime(date_str, "%d %b %Y").replace(tzinfo=timezone.utc)
            except:
                continue
    
    return datetime.now(timezone.utc)

def _deduplicate_events(events: List[HazardEvent]) -> List[HazardEvent]:
    """Enhanced deduplication based on multiple criteria"""
    unique_events = []
    seen = set()
    
    for event in events:
        key = (
            event.source,
            event.title.lower().strip(),
            event.hazard_type,
            event.event_time.date()
        )
        
        if key not in seen:
            seen.add(key)
            unique_events.append(event)
        else:
            # If duplicate found, keep the one with higher confidence
            existing_idx = next(
                (i for i, e in enumerate(unique_events) 
                 if (e.source, e.title.lower().strip(), e.hazard_type, e.event_time.date()) == key),
                None
            )
            if existing_idx is not None and event.confidence_score > unique_events[existing_idx].confidence_score:
                unique_events[existing_idx] = event
    
    return unique_events

# Dependency for rate limiting
async def rate_limit_check(request: HazardRequest):
    if not check_rate_limit(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    return request

# Enhanced API endpoint with Supabase integration
@app.post("/fetch_water_hazards/", response_model=APIResponse)
async def fetch_water_hazards(
    request: HazardRequest = Depends(rate_limit_check),
    background_tasks: BackgroundTasks = None
):
    """
    Enhanced endpoint with Supabase storage and comprehensive caching.
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing request for user {request.user_id} ({request.user_email}) at {request.latitude}, {request.longitude}")
        
        # Get user location name for better storage
        location_name, _ = await reverse_geocode_cached(request.latitude, request.longitude)
        
        # Step 1: Get cached events from user_discoveries table (faster)
        cached_events = await get_cached_events_from_discoveries(
            request.latitude, request.longitude, 
            config.MAX_RADIUS_KM, request.hazard_type
        )
        
        # Step 2: Fetch fresh data from external sources
        tasks = [
            fetch_nasa_eonet_data(request.latitude, request.longitude, request.hazard_type),
            fetch_news_api_data(request.latitude, request.longitude, request.hazard_type),
            fetch_incois_data(request.latitude, request.longitude, request.hazard_type)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Step 3: Process fresh results
        fresh_events = []
        source_stats = {"NASA": 0, "NewsAPI": 0, "INCOIS": 0}
        errors = []
        
        for i, (result, source) in enumerate(zip(results, ["NASA", "NewsAPI", "INCOIS"])):
            if isinstance(result, list):
                fresh_events.extend(result)
                source_stats[source] = len(result)
            else:
                logger.error(f"{source} task failed: {result}")
                errors.append(f"{source}: {str(result)}")
        
        # Step 4: Store fresh events in Supabase (background task)
        if fresh_events and background_tasks:
            background_tasks.add_task(
                store_events_batch, 
                fresh_events,
                request.user_email,
                request.user_id,
                request.latitude,
                request.longitude,
                location_name
            )
        
        # Step 5: Combine, deduplicate and sort all events
        all_events = cached_events + fresh_events
        unique_events = _deduplicate_events(all_events)
        unique_events.sort(key=lambda x: (x.confidence_score, x.event_time), reverse=True)
        
        # Limit results
        unique_events = unique_events[:50]
        
        execution_time = time.time() - start_time
        
        # Comprehensive metadata
        metadata = {
            "total_events": len(unique_events),
            "cached_events": len(cached_events),
            "fresh_events": len(fresh_events),
            "source_breakdown": source_stats,
            "execution_time_seconds": round(execution_time, 2),
            "user_info": {
                "user_id": request.user_id,
                "user_email": request.user_email
            },
            "filters_applied": {
                "geospatial_radius_km": config.MAX_RADIUS_KM,
                "temporal_window_days": config.TIME_WINDOW_DAYS,
                "hazard_type": request.hazard_type or "all_water_hazards"
            },
            "errors": errors if errors else None,
            "location": location_name,
            "data_sources": ["Supabase User Discoveries", "NASA EONET", "NewsAPI", "INCOIS"]
        }
        
        logger.info(f"Request completed successfully in {execution_time:.2f}s: {len(unique_events)} events (cached: {len(cached_events)}, fresh: {len(fresh_events)})")
        
        return APIResponse(
            success=True,
            data=unique_events,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Critical error in fetch_water_hazards: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your request"
        )

# Enhanced user endpoints that work directly with the user_discoveries table
@app.get("/user/events")
async def get_user_events(user_email: str, limit: int = 50, hazard_type: Optional[str] = None):
    """Get events discovered by a specific user - directly from user_discoveries table"""
    try:
        # Get user UUID
        user_result = supabase.table("users").select("id").eq("email", user_email).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_uuid = user_result.data[0]["id"]
        
        # Query user_discoveries table directly
        query = supabase.table("user_discoveries").select("*").eq("user_id", user_uuid)
        
        if hazard_type:
            query = query.eq("hazard_type", hazard_type)
        
        discoveries = query.order("discovered_at", desc=True).limit(limit).execute()
        
        events = []
        for discovery in discoveries.data:
            event = HazardEvent(
                source=discovery["source"],
                title=discovery["title"],
                description=discovery["description"],
                hazard_type=discovery["hazard_type"],
                event_time=datetime.fromisoformat(discovery["event_time"]),
                url=discovery["url"],
                latitude=discovery.get("event_latitude"),
                longitude=discovery.get("event_longitude"),
                confidence_score=discovery.get("confidence_score", 0.5),
                distance_km=discovery.get("distance_km"),
                event_unique_id=f"{discovery['source']}_{discovery['event_id']}",
                location_name=discovery.get("location_name")
            )
            events.append(event)
        
        return APIResponse(
            success=True,
            data=events,
            metadata={
                "total_events": len(events),
                "user_email": user_email,
                "hazard_type_filter": hazard_type,
                "source": "User Discoveries Table",
                "note": "Direct query from user_discoveries table for frontend efficiency"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user events"
        )

@app.get("/user/stats")
async def get_user_stats(user_email: str):
    """Get comprehensive statistics for a specific user"""
    try:
        # Get user info
        user_result = supabase.table("users").select("id, name, role, created_at").eq("email", user_email).execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_result.data[0]
        user_uuid = user_data["id"]
        
        # Get discovery count directly from user_discoveries
        discovery_count = supabase.table("user_discoveries").select("id", count="exact").eq("user_id", user_uuid).execute()
        
        # Get recent discoveries
        recent_discoveries = supabase.table("user_discoveries").select(
            "discovered_at, hazard_type"
        ).eq("user_id", user_uuid).gte(
            "discovered_at", 
            (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        ).execute()
        
        # Get hazard type breakdown
        hazard_type_stats = {}
        for discovery in recent_discoveries.data:
            hazard_type = discovery.get("hazard_type", "unknown")
            hazard_type_stats[hazard_type] = hazard_type_stats.get(hazard_type, 0) + 1
        
        return {
            "user_info": {
                "name": user_data["name"],
                "email": user_email,
                "role": user_data["role"],
                "member_since": user_data["created_at"]
            },
            "discovery_stats": {
                "total_discoveries": discovery_count.count if discovery_count.count else 0,
                "discoveries_last_30_days": len(recent_discoveries.data),
                "hazard_type_breakdown": hazard_type_stats
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user statistics"
        )

@app.get("/events/recent")
async def get_recent_events(
    limit: int = 50, 
    hazard_type: Optional[str] = None,
    hours: int = 24
):
    """Get recent events from all users - perfect for frontend dashboard"""
    try:
        # Calculate time threshold
        time_threshold = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        # Query user_discoveries table
        query = supabase.table("user_discoveries").select("*")
        
        if hazard_type:
            query = query.eq("hazard_type", hazard_type)
        
        query = query.gte("discovered_at", time_threshold.isoformat())
        query = query.order("confidence_score", desc=True).order("discovered_at", desc=True)
        
        result = query.limit(limit).execute()
        
        events = []
        seen_event_ids = set()  # Prevent duplicates
        
        for row in result.data:
            # Skip duplicates
            if row["event_id"] in seen_event_ids:
                continue
            
            seen_event_ids.add(row["event_id"])
            
            event = HazardEvent(
                source=row["source"],
                title=row["title"],
                description=row["description"],
                hazard_type=row["hazard_type"],
                event_time=datetime.fromisoformat(row["event_time"]),
                url=row["url"],
                latitude=row.get("event_latitude"),
                longitude=row.get("event_longitude"),
                confidence_score=row.get("confidence_score", 0.5),
                distance_km=row.get("distance_km"),
                event_unique_id=f"{row['source']}_{row['event_id']}",
                location_name=row.get("location_name")
            )
            events.append(event)
        
        return APIResponse(
            success=True,
            data=events,
            metadata={
                "total_events": len(events),
                "time_window_hours": hours,
                "hazard_type_filter": hazard_type,
                "source": "Recent User Discoveries",
                "note": "Optimized for frontend dashboard - shows unique recent events from all users"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting recent events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving recent events"
        )

@app.get("/", response_model=Dict[str, Any])
async def root():
    """Enhanced root endpoint with comprehensive API information"""
    return {
        "message": "Water-Related Disaster & Hazard Information API with Enhanced Supabase Storage",
        "version": "2.1.0",
        "status": "operational",
        "supported_hazard_types": list(WATER_HAZARD_TYPES.keys()),
        "filters": {
            "geospatial_radius_km": config.MAX_RADIUS_KM,
            "temporal_window_days": config.TIME_WINDOW_DAYS,
            "content": "water-related hazards only"
        },
        "features": [
            "Rate limiting",
            "Confidence scoring", 
            "Enhanced error handling",
            "Comprehensive metadata",
            "Retry mechanisms",
            "Caching",
            "Enhanced Supabase storage",
            "Event deduplication",
            "User tracking",
            "Multi-user discovery tracking",
            "Frontend-optimized queries",
            "Location name resolution"
        ],
        "endpoints": {
            "POST /fetch_water_hazards/": "Fetch and store water-related disaster information",
            "GET /user/events": "Get events discovered by specific user (with optional hazard_type filter)",
            "GET /user/stats": "Get user discovery statistics with hazard breakdown",
            "GET /events/recent": "Get recent events from all users (perfect for frontend)",
            "GET /health": "Health check",
            "GET /metrics": "API metrics"
        },
        "data_sources": ["Supabase User Discoveries", "NASA EONET", "NewsAPI", "INCOIS"],
        "storage_optimization": {
            "user_discoveries_table": "Contains all event details for fast frontend queries",
            "hazard_events_table": "Master events table for deduplication",
            "location_names": "Human-readable location names included"
        }
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with Supabase status"""
    try:
        # Test Supabase connection
        result = supabase.table("users").select("id").limit(1).execute()
        supabase_status = "connected"
        
        # Get database stats
        event_count = supabase.table("hazard_events").select("id", count="exact").execute()
        user_count = supabase.table("users").select("id", count="exact").execute()
        discovery_count = supabase.table("user_discoveries").select("id", count="exact").execute()
        
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        supabase_status = "disconnected"
        event_count = user_count = discovery_count = None
    
    return {
        "status": "healthy" if supabase_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc),
        "services": {
            "supabase": supabase_status,
            "nasa_eonet": "available" if config.NASA_API_KEY else "unavailable",
            "news_api": "available" if config.NEWS_API_KEY else "unavailable"
        },
        "database_stats": {
            "total_events": event_count.count if event_count and event_count.count else 0,
            "total_users": user_count.count if user_count and user_count.count else 0,
            "total_discoveries": discovery_count.count if discovery_count and discovery_count.count else 0
        },
        "table_structure": {
            "user_discoveries": "Enhanced with all event details for frontend efficiency",
            "hazard_events": "Master events table",
            "users": "User management table"
        },
        "configuration": {
            "max_radius_km": config.MAX_RADIUS_KM,
            "time_window_days": config.TIME_WINDOW_DAYS,
            "request_timeout": config.REQUEST_TIMEOUT,
            "max_retries": config.MAX_RETRIES
        }
    }

@app.get("/metrics")
async def get_metrics():
    """API metrics with comprehensive statistics"""
    try:
        # Get events from last 24 hours
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_events = supabase.table("hazard_events").select("id", count="exact").gte("created_at", yesterday.isoformat()).execute()
        
        # Get active users (users who made discoveries in last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        active_users = supabase.table("user_discoveries").select("user_id", count="exact").gte("discovered_at", week_ago.isoformat()).execute()
        
        # Get hazard type distribution from recent discoveries
        recent_discoveries = supabase.table("user_discoveries").select("hazard_type").gte("discovered_at", yesterday.isoformat()).execute()
        
        hazard_distribution = {}
        for discovery in recent_discoveries.data:
            hazard_type = discovery.get("hazard_type", "unknown")
            hazard_distribution[hazard_type] = hazard_distribution.get(hazard_type, 0) + 1
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        recent_events = active_users = None
        hazard_distribution = {}
    
    return {
        "active_rate_limits": len(request_counts),
        "cache_size": len(_reverse_geocode_cache),
        "database_metrics": {
            "events_last_24h": recent_events.count if recent_events and recent_events.count else 0,
            "active_users_last_7d": active_users.count if active_users and active_users.count else 0,
            "hazard_type_distribution_24h": hazard_distribution
        },
        "timestamp": datetime.now(timezone.utc)
    }

if __name__ == "__main__":
    uvicorn.run(
        "webscraping:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
        access_log=True
    )
