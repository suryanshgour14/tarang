import os
import uuid
import base64
import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import logging
import asyncio
import re

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from pydantic_settings import BaseSettings
from supabase import create_client, Client
from PIL import Image
import tensorflow as tf
import numpy as np
import piexif
import requests

# Configure logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# THEN check OCR availability
try:
    import pytesseract
    OCR_AVAILABLE = True
    logger.info("✅ OCR (pytesseract) available for text-based GPS detection")
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("⚠️ OCR not available. Install: pip install pytesseract")

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
        # The saved model's XLA JIT setting made a single-shot prediction on
        # Render's free-tier CPU hang for minutes (JIT compile overhead only
        # pays off across many repeated calls, not a one-off web request).
        # Force plain eager execution instead.
        try:
            model.jit_compile = False
        except Exception:
            pass
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
        # Calling the model directly (vs. model.predict()) runs eagerly for a
        # single batch instead of going through Keras's tf.function-traced
        # predict loop, avoiding a slow first-call graph/XLA compile.
        prediction_value = float(model(img_batch, training=False)[0][0])

        if prediction_value > settings.CONFIDENCE_THRESHOLD:
            return {"prediction": "Waterbody", "confidence": float(prediction_value)}
        else:
            predicted_class = "No Waterbody"
            confidence_score = 1 - prediction_value
            return {"prediction": predicted_class, "confidence": float(confidence_score)}

    except Exception as e:
        logger.error(f"Error in process_and_predict: {e}")
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")

def get_current_location_and_time() -> tuple[Dict[str, Any], str]:
    """
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

def extract_existing_gps_data(image: Image.Image) -> Optional[Dict[str, Any]]:
    """
    ULTRA-ENHANCED GPS extraction with:
    1. Standard EXIF GPS extraction (3 methods)
    2. OCR text detection for GPS coordinates
    3. Pattern matching for coordinate formats
    4. Comprehensive debugging
    """
    logger.info(f"🗺️ Starting ENHANCED GPS extraction for image format: {image.format}")
    logger.info(f"📊 Image info keys: {list(image.info.keys()) if hasattr(image, 'info') else 'No info'}")
    
    try:
        gps_data = {}
        
        # METHOD 1: Traditional EXIF GPS extraction (your existing code)
        logger.info("🔍 METHOD 1: Trying EXIF GPS extraction...")
        
        if hasattr(image, 'info') and 'exif' in image.info:
            logger.info("✅ EXIF data found in image.info")
            
            try:
                exif_dict = piexif.load(image.info['exif'])
                logger.info(f"📋 EXIF sections found: {list(exif_dict.keys())}")
                
                if 'GPS' in exif_dict and exif_dict['GPS']:
                    gps_info = exif_dict['GPS']
                    logger.info(f"🛰️ GPS EXIF tags found: {list(gps_info.keys())}")
                    
                    # Log raw GPS data for debugging
                    for tag_id, value in gps_info.items():
                        tag_name = piexif.GPSIFD.get(tag_id, f"Unknown_{tag_id}")
                        logger.info(f"  {tag_name} ({tag_id}): {value}")
                    
                    # Extract latitude with enhanced error handling
                    lat_tag = piexif.GPSIFD.GPSLatitude  # Tag ID: 2
                    lat_ref_tag = piexif.GPSIFD.GPSLatitudeRef  # Tag ID: 1
                    
                    logger.info(f"🔍 Looking for latitude tags: {lat_tag} and {lat_ref_tag}")
                    logger.info(f"🔍 Available GPS tags: {list(gps_info.keys())}")
                    
                    if lat_tag in gps_info and lat_ref_tag in gps_info:
                        try:
                            lat_data = gps_info[lat_tag]
                            lat_ref = gps_info[lat_ref_tag]
                            
                            logger.info(f"📍 Raw latitude data: {lat_data}")
                            logger.info(f"📍 Raw latitude ref: {lat_ref}")
                            
                            # Handle different data formats
                            if isinstance(lat_ref, bytes):
                                lat_ref = lat_ref.decode('ascii')
                            elif isinstance(lat_ref, str):
                                pass  # Already a string
                            else:
                                logger.warning(f"⚠️ Unexpected lat_ref type: {type(lat_ref)}")
                            
                            # Validate lat_data structure
                            if not isinstance(lat_data, (list, tuple)) or len(lat_data) < 3:
                                logger.error(f"❌ Invalid latitude data structure: {lat_data}")
                            else:
                                # Convert degrees/minutes/seconds to decimal
                                try:
                                    # Handle different fraction formats
                                    def safe_divide(numerator, denominator):
                                        if denominator == 0:
                                            logger.warning(f"⚠️ Division by zero, using numerator: {numerator}")
                                            return numerator
                                        return numerator / denominator
                                    
                                    lat_deg = safe_divide(lat_data[0][0], lat_data[0][1])
                                    lat_min = safe_divide(lat_data[1][0], lat_data[1][1])
                                    lat_sec = safe_divide(lat_data[2][0], lat_data[2][1])
                                    
                                    latitude = lat_deg + (lat_min / 60) + (lat_sec / 3600)
                                    
                                    logger.info(f"📐 Calculated latitude: {lat_deg}° {lat_min}' {lat_sec}\" = {latitude}")
                                    
                                    # Apply hemisphere
                                    if lat_ref.upper().startswith('S'):
                                        latitude = -latitude
                                        logger.info(f"🌍 Applied South hemisphere: {latitude}")
                                    
                                    gps_data['latitude'] = latitude
                                    
                                except Exception as lat_calc_error:
                                    logger.error(f"❌ Error calculating latitude: {lat_calc_error}")
                        
                        except Exception as lat_error:
                            logger.error(f"❌ Error extracting latitude: {lat_error}")
                    else:
                        logger.warning(f"⚠️ Missing latitude tags. Available: {list(gps_info.keys())}")
                    
                    # Extract longitude with enhanced error handling
                    lon_tag = piexif.GPSIFD.GPSLongitude  # Tag ID: 4
                    lon_ref_tag = piexif.GPSIFD.GPSLongitudeRef  # Tag ID: 3
                    
                    if lon_tag in gps_info and lon_ref_tag in gps_info:
                        try:
                            lon_data = gps_info[lon_tag]
                            lon_ref = gps_info[lon_ref_tag]
                            
                            logger.info(f"🌐 Raw longitude data: {lon_data}")
                            logger.info(f"🌐 Raw longitude ref: {lon_ref}")
                            
                            # Handle different data formats
                            if isinstance(lon_ref, bytes):
                                lon_ref = lon_ref.decode('ascii')
                            elif isinstance(lon_ref, str):
                                pass
                            else:
                                logger.warning(f"⚠️ Unexpected lon_ref type: {type(lon_ref)}")
                            
                            if not isinstance(lon_data, (list, tuple)) or len(lon_data) < 3:
                                logger.error(f"❌ Invalid longitude data structure: {lon_data}")
                            else:
                                try:
                                    def safe_divide(numerator, denominator):
                                        if denominator == 0:
                                            logger.warning(f"⚠️ Division by zero, using numerator: {numerator}")
                                            return numerator
                                        return numerator / denominator
                                    
                                    lon_deg = safe_divide(lon_data[0][0], lon_data[0][1])
                                    lon_min = safe_divide(lon_data[1][0], lon_data[1][1])
                                    lon_sec = safe_divide(lon_data[2][0], lon_data[2][1])
                                    
                                    longitude = lon_deg + (lon_min / 60) + (lon_sec / 3600)
                                    
                                    logger.info(f"📐 Calculated longitude: {lon_deg}° {lon_min}' {lon_sec}\" = {longitude}")
                                    
                                    # Apply hemisphere
                                    if lon_ref.upper().startswith('W'):
                                        longitude = -longitude
                                        logger.info(f"🌍 Applied West hemisphere: {longitude}")
                                    
                                    gps_data['longitude'] = longitude
                                    
                                except Exception as lon_calc_error:
                                    logger.error(f"❌ Error calculating longitude: {lon_calc_error}")
                        
                        except Exception as lon_error:
                            logger.error(f"❌ Error extracting longitude: {lon_error}")
                    else:
                        logger.warning(f"⚠️ Missing longitude tags. Available: {list(gps_info.keys())}")
                
                else:
                    logger.warning("⚠️ No GPS section found in EXIF data")
                    
            except Exception as piexif_error:
                logger.error(f"❌ piexif processing failed: {piexif_error}")
        
        else:
            logger.warning("⚠️ No EXIF data found in image.info")
        
        # METHOD 2: PIL built-in methods (your existing fallbacks)
        if not gps_data:
            logger.info("🔍 METHOD 2: Trying PIL EXIF methods...")
            try:
                from PIL.ExifTags import TAGS, GPSTAGS
                
                if hasattr(image, '_getexif'):
                    exif = image._getexif()
                    if exif is not None:
                        logger.info("✅ Found EXIF using _getexif()")
                        
                        # Look for GPSInfo tag (usually tag 34853)
                        for tag, value in exif.items():
                            tag_name = TAGS.get(tag, tag)
                            if tag_name == 'GPSInfo':
                                logger.info(f"🛰️ Found GPSInfo: {value}")
                                
                                # Extract GPS coordinates from GPSInfo
                                if 'GPSLatitude' in value and 'GPSLatitudeRef' in value:
                                    lat_dms = value['GPSLatitude']
                                    lat_ref = value['GPSLatitudeRef']
                                    latitude = lat_dms[0] + lat_dms[1]/60 + lat_dms[2]/3600
                                    if lat_ref == 'S':
                                        latitude = -latitude
                                    gps_data['latitude'] = latitude
                                    logger.info(f"📍 Extracted latitude via PIL: {latitude}")
                                
                                if 'GPSLongitude' in value and 'GPSLongitudeRef' in value:
                                    lon_dms = value['GPSLongitude']
                                    lon_ref = value['GPSLongitudeRef']
                                    longitude = lon_dms[0] + lon_dms[1]/60 + lon_dms[2]/3600
                                    if lon_ref == 'W':
                                        longitude = -longitude
                                    gps_data['longitude'] = longitude
                                    logger.info(f"🌐 Extracted longitude via PIL: {longitude}")
                                break
                        
            except Exception as pil_error:
                logger.error(f"❌ PIL EXIF extraction failed: {pil_error}")
        
        # METHOD 3: OCR TEXT-BASED GPS DETECTION (NEW!)
        if not gps_data and OCR_AVAILABLE:
            logger.info("🔍 METHOD 3: Trying OCR text-based GPS detection...")
            
            try:
                # Extract text from image using OCR
                text = pytesseract.image_to_string(image, config='--psm 6')
                logger.info(f"📝 OCR extracted text: {text[:200]}..." if len(text) > 200 else f"📝 OCR extracted text: {text}")
                
                if text.strip():
                    # Look for GPS coordinate patterns in text
                    gps_from_text = extract_gps_from_text(text)
                    if gps_from_text:
                        gps_data.update(gps_from_text)
                        gps_data['extraction_method'] = 'ocr_text'
                        logger.info(f"✅ GPS found in text: {gps_data}")
                
            except Exception as ocr_error:
                logger.error(f"❌ OCR GPS extraction failed: {ocr_error}")
        
        # METHOD 4: IMAGE ANALYSIS FOR COORDINATE PATTERNS (NEW!)
        if not gps_data:
            logger.info("🔍 METHOD 4: Trying visual pattern detection...")
            
            try:
                # Look for coordinate-like patterns in the image
                visual_gps = extract_gps_from_visual_patterns(image)
                if visual_gps:
                    gps_data.update(visual_gps)
                    gps_data['extraction_method'] = 'visual_pattern'
                    logger.info(f"✅ GPS found via visual pattern: {gps_data}")
                
            except Exception as visual_error:
                logger.error(f"❌ Visual pattern GPS extraction failed: {visual_error}")
        
        # Final validation
        if gps_data and 'latitude' in gps_data and 'longitude' in gps_data:
            lat = gps_data['latitude']
            lon = gps_data['longitude']
            
            logger.info(f"🎯 Final GPS coordinates: {lat:.6f}, {lon:.6f}")
            
            # Validate coordinate ranges
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                logger.info("✅ GPS coordinates are valid!")
                
                # Add metadata
                if 'extraction_method' not in gps_data:
                    gps_data['extraction_method'] = 'exif'
                gps_data['extraction_timestamp'] = datetime.now(timezone.utc).isoformat()
                
                return gps_data
            else:
                logger.error(f"❌ GPS coordinates out of valid range: lat={lat}, lon={lon}")
                return None
        else:
            logger.error("❌ No valid GPS coordinates found after all extraction attempts")
            return None
    
    except Exception as e:
        logger.error(f"❌ Critical error in GPS extraction: {e}")
        import traceback
        logger.error(f"📋 Full traceback: {traceback.format_exc()}")
        return None


def extract_gps_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract GPS coordinates from OCR text using pattern matching
    Supports multiple coordinate formats:
    - Decimal: 12.345678, -98.765432
    - DMS: 12°34'56.78"N, 98°76'54.32"W
    - Mixed formats with various separators
    """
    logger.info("🔤 Analyzing text for GPS coordinate patterns...")
    
    try:
        # Clean up the text
        text = text.replace('\n', ' ').replace('\t', ' ')
        logger.info(f"🧹 Cleaned text: {text}")
        
        # Pattern 1: Decimal degrees (most common)
        # Examples: "12.345678, -98.765432" or "Lat: 12.345 Lon: -98.765"
        decimal_patterns = [
            r'(?:lat(?:itude)?[:\s]*)?(-?\d+\.?\d*)[,\s]+(?:lon(?:gitude)?[:\s]*)?(-?\d+\.?\d*)',
            r'(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)',
            r'(?:GPS[:\s]*)?(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)',
            r'(?:Location[:\s]*)?(-?\d+\.\d+)[,\s]*[,\s]+(-?\d+\.\d+)'
        ]
        
        for pattern in decimal_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                for match in matches:
                    try:
                        lat, lon = float(match[0]), float(match[1])
                        if -90 <= lat <= 90 and -180 <= lon <= 180:
                            logger.info(f"✅ Found decimal GPS in text: {lat}, {lon}")
                            return {
                                'latitude': lat,
                                'longitude': lon,
                                'source': 'ocr_decimal',
                                'raw_text': text[:100]
                            }
                    except (ValueError, IndexError):
                        continue
        
        # Pattern 2: Degrees, Minutes, Seconds (DMS)
        # Examples: "12°34'56.78"N, 98°76'54.32"W"
        dms_pattern = r'(\d+)°(\d+)[\'′](\d+(?:\.\d+)?)[\"″]?([NSEW])'
        dms_matches = re.findall(dms_pattern, text, re.IGNORECASE)
        
        if len(dms_matches) >= 2:
            try:
                # Convert first two matches to decimal
                coords = []
                for deg, min_val, sec, direction in dms_matches[:2]:
                    decimal = int(deg) + int(min_val)/60 + float(sec)/3600
                    if direction.upper() in ['S', 'W']:
                        decimal = -decimal
                    coords.append(decimal)
                
                if len(coords) == 2:
                    lat, lon = coords[0], coords[1]
                    # Ensure lat/lon are in correct order
                    if abs(lat) <= 90 and abs(lon) <= 180:
                        logger.info(f"✅ Found DMS GPS in text: {lat}, {lon}")
                        return {
                            'latitude': lat,
                            'longitude': lon,
                            'source': 'ocr_dms',
                            'raw_text': text[:100]
                        }
            
            except (ValueError, IndexError) as e:
                logger.warning(f"⚠️ DMS conversion failed: {e}")
        
        # Pattern 3: Look for any numbers that could be coordinates
        # As a last resort, find any decimal numbers in reasonable ranges
        number_pattern = r'-?\d{1,3}\.\d{4,}'
        numbers = re.findall(number_pattern, text)
        
        if len(numbers) >= 2:
            for i in range(len(numbers) - 1):
                try:
                    lat, lon = float(numbers[i]), float(numbers[i + 1])
                    if -90 <= lat <= 90 and -180 <= lon <= 180:
                        logger.info(f"✅ Found numeric GPS pattern in text: {lat}, {lon}")
                        return {
                            'latitude': lat,
                            'longitude': lon,
                            'source': 'ocr_numeric_pattern',
                            'raw_text': text[:100]
                        }
                except (ValueError, IndexError):
                    continue
        
        logger.info("❌ No GPS coordinates found in text")
        return None
        
    except Exception as e:
        logger.error(f"❌ Text GPS extraction error: {e}")
        return None


def extract_gps_from_visual_patterns(image: Image.Image) -> Optional[Dict[str, Any]]:
    """
    Advanced visual pattern detection for GPS coordinates
    Looks for coordinate-like visual patterns in the image
    """
    logger.info("👁️ Analyzing image for visual GPS patterns...")
    
    try:
        # Convert image to grayscale for better OCR
        if image.mode != 'L':
            gray_image = image.convert('L')
        else:
            gray_image = image
        
        # Enhance image contrast for better text detection
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(gray_image)
        enhanced_image = enhancer.enhance(2.0)
        
        # Try OCR with different configurations
        configs = [
            '--psm 6 -c tessedit_char_whitelist=0123456789.,-°\'"NSEW ',
            '--psm 8 -c tessedit_char_whitelist=0123456789.,-°\'"NSEW ',
            '--psm 13',
        ]
        
        for config in configs:
            try:
                text = pytesseract.image_to_string(enhanced_image, config=config)
                if text.strip():
                    gps_from_text = extract_gps_from_text(text)
                    if gps_from_text:
                        logger.info(f"✅ Visual pattern detection successful with config: {config}")
                        return gps_from_text
            except Exception as config_error:
                logger.warning(f"⚠️ Config {config} failed: {config_error}")
                continue
        
        logger.info("❌ No GPS found via visual pattern detection")
        return None
        
    except Exception as e:
        logger.error(f"❌ Visual pattern detection error: {e}")
        return None


# ENHANCED DEBUG ENDPOINT
@app.post("/debug/gps_extraction_enhanced")
async def debug_gps_extraction_enhanced(
    file: UploadFile = File(..., description="Image file to debug")
):
    """
    Enhanced debug endpoint with OCR and comprehensive analysis
    """
    try:
        file_content = await file.read()
        
        # Basic file info
        debug_info = {
            "filename": file.filename,
            "file_size": len(file_content),
            "ocr_available": OCR_AVAILABLE
        }
        
        # Open image
        image = Image.open(io.BytesIO(file_content))
        
        # Image metadata
        debug_info["image_info"] = {
            "format": image.format,
            "mode": image.mode,
            "size": image.size,
            "has_info": hasattr(image, 'info'),
            "info_keys": list(image.info.keys()) if hasattr(image, 'info') else [],
            "has_exif": 'exif' in image.info if hasattr(image, 'info') else False,
        }
        
        # Try EXIF GPS extraction
        if debug_info["image_info"]["has_exif"]:
            try:
                exif_dict = piexif.load(image.info['exif'])
                debug_info["exif_sections"] = list(exif_dict.keys())
                debug_info["has_gps_section"] = 'GPS' in exif_dict
                
                if debug_info["has_gps_section"]:
                    gps_info = exif_dict['GPS']
                    debug_info["gps_tags"] = list(gps_info.keys())
                    debug_info["gps_tag_details"] = {}
                    
                    for tag_id, value in gps_info.items():
                        tag_name = piexif.GPSIFD.get(tag_id, f"Unknown_{tag_id}")
                        debug_info["gps_tag_details"][tag_name] = str(value)
                
            except Exception as exif_error:
                debug_info["exif_error"] = str(exif_error)
        
        # Try OCR text extraction
        if OCR_AVAILABLE:
            try:
                text = pytesseract.image_to_string(image)
                debug_info["ocr_text"] = text[:500] + "..." if len(text) > 500 else text
                debug_info["ocr_text_length"] = len(text)
                
                # Look for GPS patterns in text
                gps_from_text = extract_gps_from_text(text)
                debug_info["gps_from_ocr"] = gps_from_text
                
            except Exception as ocr_error:
                debug_info["ocr_error"] = str(ocr_error)
        
        # Try comprehensive GPS extraction
        gps_result = extract_existing_gps_data(image)
        debug_info["final_gps_result"] = gps_result
        debug_info["extraction_successful"] = gps_result is not None
        
        return debug_info
        
    except Exception as e:
        logger.error(f"Debug GPS extraction error: {e}")
        return {"error": str(e)}


# ADD OCR INSTALLATION CHECK ENDPOINT
@app.get("/debug/ocr_status")
async def check_ocr_status():
    """Check if OCR is properly installed and working"""
    try:
        if not OCR_AVAILABLE:
            return {
                "ocr_available": False,
                "message": "OCR not available. Install with: pip install pytesseract",
                "tesseract_path": None
            }
        
        # Test OCR with a simple image
        test_image = Image.new('RGB', (100, 30), color='white')
        test_text = pytesseract.image_to_string(test_image)
        
        return {
            "ocr_available": True,
            "tesseract_version": pytesseract.get_tesseract_version(),
            "test_successful": True,
            "message": "OCR is working properly for GPS text detection"
        }
        
    except Exception as e:
        return {
            "ocr_available": False,
            "error": str(e),
            "message": "OCR installation issue. Try: brew install tesseract (Mac) or apt-get install tesseract-ocr (Linux)"
        }

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

def ensure_user_exists(user_id: str) -> Dict[str, Any]:
    """
    Ensure user exists in users table, create if doesn't exist
    Returns user record
    """
    logger.info(f"🔍 Checking if user {user_id} exists...")
    
    try:
        # First, try to get the user
        user_result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if user_result.data:
            logger.info(f"✅ User {user_id} already exists")
            return user_result.data[0]
        
        # User doesn't exist, create a new one
        logger.info(f"👤 Creating new user {user_id}...")
        
        new_user_data = {
            "id": user_id,
            "email": f"user-{user_id}@waterbody-reports.com",  # Placeholder email
            "name": f"User {user_id[:8]}",  # Placeholder name
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        create_result = supabase.table("users").insert(new_user_data).execute()
        
        if not create_result.data:
            raise Exception("Failed to create user")
        
        logger.info(f"✅ User {user_id} created successfully")
        return create_result.data[0]
        
    except Exception as e:
        logger.error(f"❌ Error ensuring user exists: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User management failed: {str(e)}"
        )

# Update stage_3_supabase_integration function
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
        # STEP 0: Ensure user exists (NEW!)
        user_record = ensure_user_exists(user_id)
        
        # Step A: Upload to Supabase Storage
        unique_filename = f"{uuid.uuid4()}-waterbody-report.jpg"
        
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
            "user_id": user_id,  # Now guaranteed to exist
            "media_url": media_url,
            "media_type": "image",
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "status": "verified",
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
