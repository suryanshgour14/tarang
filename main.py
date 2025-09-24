import os
import uuid
import base64
import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import logging
import asyncio

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from pydantic_settings import BaseSettings  # Fixed import
from supabase import create_client, Client
from PIL import Image
import tensorflow as tf
import numpy as np
import piexif
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. CONFIGURATION MANAGEMENT ---

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str  # Changed from SUPABASE_KEY to SUPABASE_SERVICE_KEY
    
    # Model Configuration
    MODEL_PATH: str = "model/waterbody_classification.keras"
    CONFIDENCE_THRESHOLD: float = 0.75
    IMG_SIZE: int = 224
    
    # Google Maps API (for geolocation)
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # Upload Configuration
    UPLOAD_FOLDER: str = "uploads"
    MAX_FILE_SIZE: int = 16777216  # 16MB in bytes
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # This allows extra fields in .env to be ignored

settings = Settings()

# --- 2. GLOBAL VARIABLES ---
model = None
supabase: Client = None

# --- 3. INITIALIZE FASTAPI APP ---

app = FastAPI(
    title="Multi-Stage Report Submission API",
    description="Central orchestrator for waterbody report submissions with validation pipeline",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. PYDANTIC MODELS ---

class ReportRecord(BaseModel):
    """Model for database report record - Updated to match user_uploads table"""
    id: str
    user_id: str
    media_url: str
    media_type: str
    latitude: float
    longitude: float
    description: Optional[str]
    status: str
    model_confidence: Optional[float]
    geotag_source: Optional[str]
    created_at: str
    updated_at: str

class SuccessResponse(BaseModel):
    """Model for successful submission response"""
    message: str
    report: ReportRecord
    metadata: Dict[str, Any]

# --- 5. STARTUP EVENT ---

@app.on_event("startup")
async def startup_event():
    """Load model and initialize Supabase on startup"""
    global model, supabase
    
    # Load TensorFlow model
    logger.info(f"Loading model from: {settings.MODEL_PATH}")
    try:
        model = tf.keras.models.load_model(settings.MODEL_PATH)
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Model failed to load: {e}")
        model = None
        raise RuntimeError(f"Failed to load ML model: {e}")
    
    # Initialize Supabase client with service key
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)  # Changed to SUPABASE_SERVICE_KEY
        logger.info("Supabase client initialized successfully with service key!")
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Supabase initialization failed: {e}")
        raise RuntimeError(f"Failed to initialize Supabase: {e}")
    
    # Ensure upload directory exists
    if not os.path.exists(settings.UPLOAD_FOLDER):
        os.makedirs(settings.UPLOAD_FOLDER)

# --- 6. CORE PIPELINE FUNCTIONS (EXTRACTED FROM EXISTING FILES) ---

def process_and_predict(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extracted from waterbody_classification.py - core prediction logic
    Takes image bytes, preprocesses the image, and returns a prediction.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not available.")

    try:
        img = Image.open(io.BytesIO(image_bytes)).resize((settings.IMG_SIZE, settings.IMG_SIZE))
        img_array = np.array(img)

        if len(img_array.shape) == 3 and img_array.shape[2] == 4:  # Handle PNG with alpha channel
            img_array = img_array[:, :, :3]

        img_batch = np.expand_dims(img_array, axis=0)
        prediction_value = model.predict(img_batch, verbose=0)[0][0]

        if prediction_value > settings.CONFIDENCE_THRESHOLD:
            return {"prediction": "Waterbody", "confidence": float(prediction_value)}
        else:
            predicted_class = "No Waterbody"
            confidence_score = 1 - prediction_value
            return {"prediction": predicted_class, "confidence": float(confidence_score)}

    except Exception as e:
        logger.error(f"Error in process_and_predict: {e}")
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")

def extract_existing_gps_data(image: Image.Image) -> Optional[Dict[str, Any]]:
    """
    Extracted from geotag.py - GPS extraction logic
    Extract existing GPS data from image EXIF if available
    """
    logger.info(f"Checking GPS data in image format: {image.format}")
    
    try:
        gps_data = {}
        
        # Try piexif library
        if hasattr(image, 'info') and 'exif' in image.info:
            exif_dict = piexif.load(image.info['exif'])
            
            if 'GPS' in exif_dict and exif_dict['GPS']:
                gps_info = exif_dict['GPS']
                logger.info(f"GPS EXIF tags found: {list(gps_info.keys())}")
                
                # Extract latitude
                lat_tag = piexif.GPSIFD.GPSLatitude
                lat_ref_tag = piexif.GPSIFD.GPSLatitudeRef
                
                if lat_tag in gps_info and lat_ref_tag in gps_info:
                    try:
                        lat_data = gps_info[lat_tag]
                        lat_ref = gps_info[lat_ref_tag]
                        
                        if isinstance(lat_ref, bytes):
                            lat_ref = lat_ref.decode('ascii')
                        
                        if len(lat_data) >= 3:
                            lat_deg = lat_data[0][0] / max(lat_data[0][1], 1)
                            lat_min = lat_data[1][0] / max(lat_data[1][1], 1)
                            lat_sec = lat_data[2][0] / max(lat_data[2][1], 1)
                            latitude = lat_deg + (lat_min / 60) + (lat_sec / 3600)
                            
                            if lat_ref.upper().startswith('S'):
                                latitude = -latitude
                                
                            gps_data['latitude'] = latitude
                    except Exception as e:
                        logger.error(f"Error extracting latitude: {e}")
                
                # Extract longitude
                lon_tag = piexif.GPSIFD.GPSLongitude
                lon_ref_tag = piexif.GPSIFD.GPSLongitudeRef
                
                if lon_tag in gps_info and lon_ref_tag in gps_info:
                    try:
                        lon_data = gps_info[lon_tag]
                        lon_ref = gps_info[lon_ref_tag]
                        
                        if isinstance(lon_ref, bytes):
                            lon_ref = lon_ref.decode('ascii')
                        
                        if len(lon_data) >= 3:
                            lon_deg = lon_data[0][0] / max(lon_data[0][1], 1)
                            lon_min = lon_data[1][0] / max(lon_data[1][1], 1)
                            lon_sec = lon_data[2][0] / max(lon_data[2][1], 1)
                            longitude = lon_deg + (lon_min / 60) + (lon_sec / 3600)
                            
                            if lon_ref.upper().startswith('W'):
                                longitude = -longitude
                                
                            gps_data['longitude'] = longitude
                    except Exception as e:
                        logger.error(f"Error extracting longitude: {e}")
        
        # Validate extracted GPS data
        if gps_data and 'latitude' in gps_data and 'longitude' in gps_data:
            lat = gps_data['latitude']
            lon = gps_data['longitude']
            
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                logger.info(f"Valid GPS data found: {lat:.6f}, {lon:.6f}")
                return gps_data
            else:
                logger.error(f"Invalid GPS coordinates: {lat}, {lon}")
                return None
        else:
            logger.info("No valid GPS data found")
            return None
        
    except Exception as e:
        logger.error(f"Error extracting GPS data: {e}")
        return None

def get_current_location_and_time() -> tuple[Dict[str, Any], str]:
    """
    Extracted from geotag.py - current location logic
    Get current location using IP-based geolocation and current time
    """
    try:
        # Use IP-based geolocation service (free)
        response = requests.get('http://ip-api.com/json/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                current_location = {
                    'latitude': data['lat'],
                    'longitude': data['lon'],
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('regionName', 'Unknown'),
                    'country': data.get('country', 'Unknown'),
                    'timezone': data.get('timezone', 'Unknown')
                }
            else:
                # Fallback to default location (Hyderabad, India)
                current_location = {
                    'latitude': 17.3850,
                    'longitude': 78.4867,
                    'city': 'Hyderabad',
                    'region': 'Telangana',
                    'country': 'India',
                    'timezone': 'Asia/Kolkata'
                }
        else:
            raise Exception("API call failed")
    except:
        # Fallback location if geolocation fails
        current_location = {
            'latitude': 17.3850,
            'longitude': 78.4867,
            'city': 'Hyderabad',
            'region': 'Telangana',
            'country': 'India',
            'timezone': 'Asia/Kolkata'
        }
    
    # Get current timestamp
    current_time = datetime.now(timezone.utc).isoformat()
    
    return current_location, current_time

# --- 7. PIPELINE STAGE FUNCTIONS ---

def stage_1_waterbody_verification(image_bytes: bytes) -> Dict[str, Any]:
    """
    Stage 1: Verify the image contains a waterbody with sufficient confidence
    """
    logger.info("Stage 1: Starting waterbody verification")
    
    result = process_and_predict(image_bytes)
    
    if result.get("prediction") != "Waterbody":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image verification failed: Detected '{result.get('prediction', 'unknown')}' instead of waterbody"
        )
    
    confidence = result.get("confidence", 0.0)
    if confidence < settings.CONFIDENCE_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image verification failed: Confidence {confidence:.2f} is below required threshold of {settings.CONFIDENCE_THRESHOLD}"
        )
    
    logger.info(f"Stage 1: Waterbody verified with confidence {confidence:.2f}")
    return result

def stage_2_geotagging_live() -> Dict[str, Any]:
    """
    Stage 2: Process live capture geotagging using current location
    """
    logger.info("Stage 2: Starting live capture geotagging")
    
    try:
        current_location, current_time = get_current_location_and_time()
        
        result = {
            "success": True,
            "coordinates": {
                "latitude": current_location['latitude'],
                "longitude": current_location['longitude'],
                "source": "live_current_location"
            },
            "location_info": current_location,
            "timestamp": current_time
        }
        
        logger.info(f"Stage 2: Live capture geotagging successful")
        return result
        
    except Exception as e:
        logger.error(f"Live capture geotagging failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geotagging failed: {str(e)}"
        )

def stage_2_geotagging_upload(image_bytes: bytes) -> Dict[str, Any]:
    """
    Stage 2: Process file upload geotagging by extracting EXIF GPS data
    """
    logger.info("Stage 2: Starting file upload geotagging")
    
    try:
        # Open image and extract GPS data
        image = Image.open(io.BytesIO(image_bytes))
        gps_data = extract_existing_gps_data(image)
        
        if not gps_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No GPS data found in image. Please enable location on your camera or use live capture feature."
            )
        
        result = {
            "success": True,
            "coordinates": {
                "latitude": gps_data["latitude"],
                "longitude": gps_data["longitude"],
                "source": "exif"
            },
            "gps_metadata": gps_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"Stage 2: File upload geotagging successful")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload geotagging failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geotagging failed: {str(e)}"
        )

# ...existing code...

def stage_3_supabase_integration(
    image_bytes: bytes, 
    user_id: str, 
    latitude: float,
    longitude: float,
    confidence: float,
    geotag_source: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Stage 3: Upload to Supabase Storage and insert database record into user_uploads table
    """
    logger.info("Stage 3: Starting Supabase integration")
    
    try:
        # Step A: Upload to Supabase Storage
        unique_filename = f"{uuid.uuid4()}-waterbody-report.jpg"
        
        # Change bucket name to "user_uploads" (with underscore) to match your request
        storage_result = supabase.storage.from_("user_uploads").upload(
            unique_filename,
            image_bytes,
            {"content-type": "image/jpeg"}
        )
        
        if hasattr(storage_result, 'error') and storage_result.error:
            logger.error(f"Storage upload failed: {storage_result.error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Storage upload failed: {storage_result.error.message}"
            )
        
        # Get the public URL for the uploaded file
        media_url = supabase.storage.from_("user_uploads").get_public_url(unique_filename)
        
        # Step B: Insert database record into user_uploads table
        record_data = {
            "user_id": user_id,  # This should be a UUID
            "media_url": media_url,
            "media_type": "image",  # Required field
            "latitude": latitude,
            "longitude": longitude,
            "description": description,  # Optional field
            "status": "verified",  # Set to verified since it passed AI validation
            "model_confidence": confidence,
            "geotag_source": geotag_source
        }
        
        # Insert into user_uploads table
        db_result = supabase.table("user_uploads").insert(record_data).execute()
        
        if not db_result.data:
            logger.error("Database insert failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database insert failed"
            )
        
        record = db_result.data[0]
        logger.info(f"Stage 3: Supabase integration successful - Record ID: {record['id']}")
        return record
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Supabase integration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Supabase integration failed: {str(e)}"
        )


# --- 8. API ENDPOINTS ---

@app.post("/reports/submit/live_capture", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def submit_live_capture(
    user_id: str = Form(..., description="User UUID (must be valid UUID)"),
    image_base64: str = Form(..., description="Base64 encoded image data"),
    description: Optional[str] = Form(None, description="Optional description of the waterbody")
):
    """
    Submit a live capture report through the multi-stage validation pipeline
    """
    logger.info(f"Live capture submission from user {user_id}")
    
    try:
        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id format. Must be a valid UUID."
            )
        
        # Decode base64 image for Stage 1
        try:
            # Remove data URL prefix if present
            if ',' in image_base64:
                image_base64 = image_base64.split(',', 1)[1]
            
            image_bytes = base64.b64decode(image_base64)
            
            if len(image_bytes) < 100:  # Basic validation
                raise ValueError("Image data too small")
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 image data: {str(e)}"
            )
        
        # Stage 1: Waterbody Verification
        classification_result = stage_1_waterbody_verification(image_bytes)
        
        # Stage 2: Geotagging (Live Capture)
        geotag_result = stage_2_geotagging_live()
        
        # Stage 3: Supabase Integration
        coordinates = geotag_result["coordinates"]
        db_record = stage_3_supabase_integration(
            image_bytes=image_bytes,
            user_id=user_id,
            latitude=coordinates["latitude"],
            longitude=coordinates["longitude"],
            confidence=classification_result["confidence"],
            geotag_source="live_capture",
            description=description
        )
        
        logger.info(f"Live capture submission successful - Record ID: {db_record['id']}")
        
        return SuccessResponse(
            message="Live capture report submitted successfully",
            report=ReportRecord(**db_record),
            metadata={
                "stage_1": {"model_confidence": classification_result["confidence"]},
                "stage_2": {"geotag_source": "live_capture", "location_info": geotag_result.get("location_info")},
                "stage_3": {"media_url": db_record["media_url"]},
                "pipeline_version": "1.0.0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in live capture submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during submission"
        )

@app.post("/reports/submit/file_upload", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def submit_file_upload(
    file: UploadFile = File(..., description="Image file to upload"),
    user_id: str = Form(..., description="User UUID (must be valid UUID)"),
    description: Optional[str] = Form(None, description="Optional description of the waterbody")
):
    """
    Submit a file upload report through the multi-stage validation pipeline
    """
    logger.info(f"File upload submission from user {user_id}")
    
    try:
        # Validate UUID format
        try:
            uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id format. Must be a valid UUID."
            )
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) < 100:  # Basic validation
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is too small to be a valid image"
            )
        
        # Validate it's an image
        try:
            Image.open(io.BytesIO(file_content))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a valid image"
            )
        
        # Stage 1: Waterbody Verification
        classification_result = stage_1_waterbody_verification(file_content)
        
        # Stage 2: Geotagging (File Upload - EXIF extraction)
        geotag_result = stage_2_geotagging_upload(file_content)
        
        # Stage 3: Supabase Integration
        coordinates = geotag_result["coordinates"]
        db_record = stage_3_supabase_integration(
            image_bytes=file_content,
            user_id=user_id,
            latitude=coordinates["latitude"],
            longitude=coordinates["longitude"],
            confidence=classification_result["confidence"],
            geotag_source="exif",
            description=description
        )
        
        logger.info(f"File upload submission successful - Record ID: {db_record['id']}")
        
        return SuccessResponse(
            message="File upload report submitted successfully",
            report=ReportRecord(**db_record),
            metadata={
                "stage_1": {"model_confidence": classification_result["confidence"]},
                "stage_2": {"geotag_source": "exif", "gps_metadata": geotag_result.get("gps_metadata")},
                "stage_3": {"media_url": db_record["media_url"]},
                "pipeline_version": "1.0.0",
                "original_filename": file.filename
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in file upload submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during submission"
        )

# --- 9. UTILITY ENDPOINTS ---

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test model availability
        model_status = "loaded" if model is not None else "not_loaded"
        
        # Test Supabase connection using user_uploads table
        supabase.table("user_uploads").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {
                "tensorflow_model": model_status,
                "supabase": "connected",
                "pipeline_stages": ["waterbody_verification", "geolocation_verification", "supabase_integration"]
            },
            "configuration": {
                "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
                "model_path": settings.MODEL_PATH,
                "image_size": settings.IMG_SIZE,
                "database_table": "user_uploads",
                "storage_bucket": "user-uploads"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service health check failed"
        )

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Multi-Stage Report Submission API",
        "version": "1.0.0",
        "description": "Central orchestrator for waterbody report submissions with validation pipeline",
        "endpoints": {
            "POST /reports/submit/live_capture": "Submit live capture reports (base64)",
            "POST /reports/submit/file_upload": "Submit file upload reports",
            "GET /health": "Health check",
            "GET /docs": "API documentation"
        },
        "pipeline_stages": {
            "stage_1": "AI Waterbody Verification (confidence >= 75%)",
            "stage_2": "Geolocation Verification (GPS extraction or live location)",
            "stage_3": "Supabase Integration (storage + database)"
        },
        "flow": [
            "User submits image → Stage 1 (AI Check) → Stage 2 (Location Check) → Stage 3 (Storage) → Success!"
        ],
        "database_info": {
            "table": "user_uploads",
            "storage_bucket": "user-uploads",
            "required_fields": ["user_id (UUID)", "latitude", "longitude"],
            "optional_fields": ["description"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Multi-Stage Report Submission API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
