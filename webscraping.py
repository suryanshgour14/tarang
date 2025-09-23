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

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator, Field
import uvicorn
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

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
    MAX_RADIUS_KM: int = 80
    TIME_WINDOW_DAYS: int = 5  # Changed back to 5 days
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    RATE_LIMIT_PER_MINUTE: int = 60
    
    def __post_init__(self):
        if not self.NASA_API_KEY or not self.NEWS_API_KEY:
            logger.warning("Some API keys are missing from environment variables")

config = Config()

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

# Enhanced Pydantic models with better validation
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
                "distance_km": 15.2
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
    logger.info("Starting Water Hazards API...")
    yield
    # Shutdown
    logger.info("Shutting down Water Hazards API...")

# Initialize FastAPI app with enhanced configuration
app = FastAPI(
    title="Water-Related Disaster & Hazard Information API",
    description="Enterprise-grade API for aggregating real-time water-related disaster information",
    version="2.0.0",
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
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
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

# Enhanced helper functions
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points using Haversine formula.
    Optimized with early returns for performance.
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0
    
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(min(1.0, a)))  # Prevent domain errors
    
    return 6371 * c  # Earth's radius in km

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
    """
    Enhanced reverse geocoding with retry logic and better coastal detection.
    """
    try:
        # --- THIS IS THE FIX ---
        # We explicitly tell the client to follow redirects.
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
    
    # Ensure timezone awareness
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    time_threshold = now - timedelta(days=days)
    return event_time >= time_threshold

def classify_water_hazard_enhanced(text: str, specified_type: Optional[str] = None) -> tuple[str, float]:
    """
    Enhanced hazard classification with confidence scoring.
    Returns (hazard_type, confidence_score)
    """
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

# Enhanced data source functions with better error handling and retry logic
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
        # Add date filtering for past 5 days
        start_date = (datetime.now() - timedelta(days=config.TIME_WINDOW_DAYS)).strftime('%Y-%m-%d')
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            url = "https://eonet.gsfc.nasa.gov/api/v3/events"
            params = {
                "status": "open",  # Changed back to "open" for recent events
                "start": start_date,  # Added back start date filtering
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
                                    distance_km=round(distance, 2)
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
        
        # Add date filtering back for past 5 days
        from_date = (datetime.now() - timedelta(days=config.TIME_WINDOW_DAYS)).strftime('%Y-%m-%d')
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": f"({keywords}) AND {location}",
                "from": from_date,  # Added back date filtering
                "language": "en",
                "sortBy": "publishedAt",
                "apiKey": config.NEWS_API_KEY,
                "pageSize": 50  # Reduced back to 50 for better performance
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
                    distance_km=0.0  # Approximate location
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
        _, is_coastal = await reverse_geocode_cached(latitude, longitude)
        if not is_coastal:
            logger.info("Location not in Indian coastal area, skipping INCOIS data")
            return events
        
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            # Enhanced tsunami bulletin scraping
            if not hazard_type or hazard_type == "tsunami":
                events.extend(await _scrape_tsunami_bulletins(client))
            
            # Enhanced storm surge warning scraping
            if not hazard_type or hazard_type in ["severeStorm", "stormSurge"]:
                events.extend(await _scrape_storm_surge_warnings(client))
    
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
                        
                        # Enhanced date parsing
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
                                confidence_score=0.9  # High confidence for official bulletins
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
        processed_texts = set()  # Avoid duplicates
        
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
                    confidence_score=0.8
                )
                events.append(hazard_event)
                break  # Limit to one storm surge warning to avoid duplicates
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

# Dependency for rate limiting
async def rate_limit_check(request: HazardRequest):
    if not check_rate_limit(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    return request

# Enhanced API endpoint
@app.post("/fetch_water_hazards/", response_model=APIResponse)
async def fetch_water_hazards(
    request: HazardRequest = Depends(rate_limit_check),
    background_tasks: BackgroundTasks = None
):
    """
    Enhanced endpoint with comprehensive error handling, rate limiting, and detailed response metadata.
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing request for user {request.user_id} at {request.latitude}, {request.longitude}")
        
        # Fetch data concurrently with proper error isolation
        tasks = [
            fetch_nasa_eonet_data(request.latitude, request.longitude, request.hazard_type),
            fetch_news_api_data(request.latitude, request.longitude, request.hazard_type),
            fetch_incois_data(request.latitude, request.longitude, request.hazard_type)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results with detailed error handling
        all_events = []
        source_stats = {"NASA": 0, "NewsAPI": 0, "INCOIS": 0}
        errors = []
        
        for i, (result, source) in enumerate(zip(results, ["NASA", "NewsAPI", "INCOIS"])):
            if isinstance(result, list):
                all_events.extend(result)
                source_stats[source] = len(result)
            else:
                logger.error(f"{source} task failed: {result}")
                errors.append(f"{source}: {str(result)}")
        
        # Enhanced deduplication and sorting
        unique_events = _deduplicate_events(all_events)
        unique_events.sort(key=lambda x: (x.confidence_score, x.event_time), reverse=True)
        
        # Limit results for performance
        unique_events = unique_events[:50]
        
        execution_time = time.time() - start_time
        
        # Comprehensive metadata
        metadata = {
            "total_events": len(unique_events),
            "source_breakdown": source_stats,
            "execution_time_seconds": round(execution_time, 2),
            "filters_applied": {
                "geospatial_radius_km": config.MAX_RADIUS_KM,
                "temporal_window_days": config.TIME_WINDOW_DAYS,
                "hazard_type": request.hazard_type or "all_water_hazards"
            },
            "errors": errors if errors else None,
            "location": await reverse_geocode_cached(request.latitude, request.longitude)
        }
        
        logger.info(f"Request completed successfully in {execution_time:.2f}s: {len(unique_events)} events")
        
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

def _deduplicate_events(events: List[HazardEvent]) -> List[HazardEvent]:
    """Enhanced deduplication based on multiple criteria"""
    unique_events = []
    seen = set()
    
    for event in events:
        # Create a more sophisticated key for deduplication
        key = (
            event.source,
            event.title.lower().strip(),
            event.hazard_type,
            event.event_time.date()  # Group by date instead of exact time
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

# Enhanced utility endpoints
@app.get("/", response_model=Dict[str, Any])
async def root():
    """Enhanced root endpoint with comprehensive API information"""
    return {
        "message": "Water-Related Disaster & Hazard Information API",
        "version": "2.0.0",
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
            "Caching"
        ],
        "endpoints": {
            "POST /fetch_water_hazards/": "Fetch water-related disaster information",
            "GET /health": "Health check",
            "GET /metrics": "API metrics"
        }
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with system status"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc),
        "api_keys_configured": {
            "NASA_API_KEY": bool(config.NASA_API_KEY),
            "NEWS_API_KEY": bool(config.NEWS_API_KEY)
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
    """API metrics endpoint"""
    return {
        "active_rate_limits": len(request_counts),
        "cache_size": reverse_geocode_cached.cache_info()._asdict(),
        "timestamp": datetime.now(timezone.utc)
    }

if __name__ == "__main__":
    uvicorn.run(
        "webscraping:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable in production
        log_level="info",
        access_log=True
    )