from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from PIL import Image
import piexif
import io
import datetime
import os
import uuid
import math
from config import GOOGLE_MAPS_API_KEY, UPLOAD_FOLDER

# Initialize FastAPI app
app = FastAPI(
    title="Geo-Tagging API",
    description="API for geo-tagging images with GPS coordinates",
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

# Ensure uploads directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def deg_to_dms_rational(deg_float):
    """Convert decimal degrees to EXIF format (DMS rational)."""
    deg = int(abs(deg_float))
    min_float = (abs(deg_float) - deg) * 60
    minute = int(min_float)
    sec = round((min_float - minute) * 60 * 1000000)
    
    return ((deg, 1), (minute, 1), (sec, 1000000))

def extract_existing_gps_data(image):
    """Extract existing GPS data from image EXIF if available - Enhanced version."""
    print(f"🔍 Checking GPS data in image format: {image.format}")
    
    try:
        # Try multiple methods to extract GPS data
        gps_data = {}
        
        # Method 1: Try piexif library
        try:
            exif_dict = piexif.load(image.info.get('exif', b''))
            print(f"📊 EXIF sections found: {list(exif_dict.keys())}")
            
            if 'GPS' in exif_dict and exif_dict['GPS']:
                gps_info = exif_dict['GPS']
                print(f"📍 GPS EXIF tags found: {list(gps_info.keys())}")
                
                # Extract latitude with more flexible handling
                lat_tag = piexif.GPSIFD.GPSLatitude
                lat_ref_tag = piexif.GPSIFD.GPSLatitudeRef
                
                if lat_tag in gps_info and lat_ref_tag in gps_info:
                    try:
                        lat_data = gps_info[lat_tag]
                        lat_ref = gps_info[lat_ref_tag]
                        
                        # Handle different reference formats
                        if isinstance(lat_ref, bytes):
                            lat_ref = lat_ref.decode('ascii')
                        elif isinstance(lat_ref, str):
                            lat_ref = lat_ref
                        else:
                            lat_ref = str(lat_ref)
                        
                        # Convert coordinates - handle different formats
                        if len(lat_data) >= 3:
                            lat_deg = lat_data[0][0] / max(lat_data[0][1], 1)
                            lat_min = lat_data[1][0] / max(lat_data[1][1], 1)
                            lat_sec = lat_data[2][0] / max(lat_data[2][1], 1)
                            latitude = lat_deg + (lat_min / 60) + (lat_sec / 3600)
                            
                            if lat_ref.upper().startswith('S'):
                                latitude = -latitude
                                
                            gps_data['latitude'] = latitude
                            print(f"✅ Latitude extracted: {latitude}")
                    except Exception as e:
                        print(f"⚠️ Error extracting latitude: {e}")
                
                # Extract longitude with more flexible handling
                lon_tag = piexif.GPSIFD.GPSLongitude
                lon_ref_tag = piexif.GPSIFD.GPSLongitudeRef
                
                if lon_tag in gps_info and lon_ref_tag in gps_info:
                    try:
                        lon_data = gps_info[lon_tag]
                        lon_ref = gps_info[lon_ref_tag]
                        
                        # Handle different reference formats
                        if isinstance(lon_ref, bytes):
                            lon_ref = lon_ref.decode('ascii')
                        elif isinstance(lon_ref, str):
                            lon_ref = lon_ref
                        else:
                            lon_ref = str(lon_ref)
                        
                        # Convert coordinates
                        if len(lon_data) >= 3:
                            lon_deg = lon_data[0][0] / max(lon_data[0][1], 1)
                            lon_min = lon_data[1][0] / max(lon_data[1][1], 1)
                            lon_sec = lon_data[2][0] / max(lon_data[2][1], 1)
                            longitude = lon_deg + (lon_min / 60) + (lon_sec / 3600)
                            
                            if lon_ref.upper().startswith('W'):
                                longitude = -longitude
                                
                            gps_data['longitude'] = longitude
                            print(f"✅ Longitude extracted: {longitude}")
                    except Exception as e:
                        print(f"⚠️ Error extracting longitude: {e}")
                
                # Extract altitude if available
                alt_tag = piexif.GPSIFD.GPSAltitude
                if alt_tag in gps_info:
                    try:
                        alt_data = gps_info[alt_tag]
                        altitude = alt_data[0] / max(alt_data[1], 1)
                        gps_data['altitude'] = altitude
                        print(f"✅ Altitude extracted: {altitude}m")
                    except Exception as e:
                        print(f"⚠️ Error extracting altitude: {e}")
                
                # Extract timestamp if available
                date_tag = piexif.GPSIFD.GPSDateStamp
                time_tag = piexif.GPSIFD.GPSTimeStamp
                
                if date_tag in gps_info and time_tag in gps_info:
                    try:
                        date_stamp = gps_info[date_tag]
                        time_stamp = gps_info[time_tag]
                        
                        if isinstance(date_stamp, bytes):
                            date_stamp = date_stamp.decode('ascii')
                        
                        hours = time_stamp[0][0] / max(time_stamp[0][1], 1)
                        minutes = time_stamp[1][0] / max(time_stamp[1][1], 1)
                        seconds = time_stamp[2][0] / max(time_stamp[2][1], 1)
                        
                        gps_data['timestamp'] = f"{date_stamp} {int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
                        print(f"✅ GPS timestamp extracted: {gps_data['timestamp']}")
                    except Exception as e:
                        print(f"⚠️ Error extracting GPS timestamp: {e}")
        
        except Exception as piexif_error:
            print(f"⚠️ piexif method failed: {piexif_error}")
        
        # Method 2: Try PIL's built-in EXIF (fallback)
        if not gps_data and hasattr(image, '_getexif'):
            try:
                exif = image._getexif()
                if exif and 34853 in exif:  # GPS IFD tag
                    gps_info = exif[34853]
                    print(f"📍 GPS data found via PIL: {gps_info}")
                    # Add basic extraction for PIL method if needed
            except Exception as pil_error:
                print(f"⚠️ PIL method failed: {pil_error}")
        
        # Validate extracted GPS data
        if gps_data and 'latitude' in gps_data and 'longitude' in gps_data:
            lat = gps_data['latitude']
            lon = gps_data['longitude']
            
            # Basic validation - coordinates should be within valid ranges
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                print(f"✅ Valid GPS data found: {lat:.6f}, {lon:.6f}")
                return gps_data
            else:
                print(f"❌ Invalid GPS coordinates: {lat}, {lon}")
                return None
        else:
            print("❌ No valid GPS data found")
            return None
        
    except Exception as e:
        print(f"❌ Error extracting GPS data: {e}")
        import traceback
        traceback.print_exc()
        return None

def add_exif_data(image, lat, lon, timestamp):
    """Add EXIF data to image including GPS coordinates and timestamp."""
    try:
        # Try to load existing EXIF data
        exif_dict = piexif.load(image.info.get('exif', b''))
    except:
        # Create new EXIF dict if none exists or if loading fails
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
    
    # Ensure all required sections exist
    for section in ["0th", "Exif", "GPS"]:
        if section not in exif_dict:
            exif_dict[section] = {}
    
    # Add datetime to EXIF
    dt = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    exif_datetime = dt.strftime("%Y:%m:%d %H:%M:%S")
    
    exif_dict["0th"][piexif.ImageIFD.DateTime] = exif_datetime
    exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal] = exif_datetime
    exif_dict["Exif"][piexif.ExifIFD.DateTimeDigitized] = exif_datetime
    
    # Add GPS data
    lat_ref = 'N' if lat >= 0 else 'S'
    lon_ref = 'E' if lon >= 0 else 'W'
    
    exif_dict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat_ref
    exif_dict["GPS"][piexif.GPSIFD.GPSLatitude] = deg_to_dms_rational(lat)
    exif_dict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lon_ref
    exif_dict["GPS"][piexif.GPSIFD.GPSLongitude] = deg_to_dms_rational(lon)
    
    # Add GPS timestamp
    gps_time = (
        (dt.hour, 1),
        (dt.minute, 1),
        (dt.second, 1)
    )
    exif_dict["GPS"][piexif.GPSIFD.GPSTimeStamp] = gps_time
    exif_dict["GPS"][piexif.GPSIFD.GPSDateStamp] = dt.strftime("%Y:%m:%d")
    
    return piexif.dump(exif_dict)

# Pydantic models for API responses
class ConfigResponse(BaseModel):
    googleMapsApiKey: str

class UploadResponse(BaseModel):
    message: str
    filename: str
    original_filename: str
    path: str
    coordinates: dict
    timestamp: dict
    metadata: dict
    geo_tag_status: dict
    download_url: str
    existing_coordinates: Optional[dict] = None

class CaptureResponse(BaseModel):
    message: str
    filename: str
    image_url: str
    image_base64: str
    user_email: str
    user_id: Optional[str] = None
    coordinates: dict
    timestamp: dict
    metadata: dict
    location_info: dict
    map_data: dict
    download_url: str

def get_current_location_and_time():
    """Get current location using IP-based geolocation and current time"""
    import requests
    import datetime
    
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
    current_time = datetime.datetime.now().isoformat()
    
    return current_location, current_time

def add_geolocation_overlay(image, latitude, longitude, timestamp, location_info=None):
    """Add geo-location information overlay to the image"""
    from PIL import ImageDraw, ImageFont
    import requests
    from io import BytesIO
    
    # Create a copy of the image to modify
    overlay_img = image.copy()
    print(f"🎨 Overlay: Original {image.size} -> Copy {overlay_img.size}, mode={overlay_img.mode}")
    
    draw = ImageDraw.Draw(overlay_img)
    
    # Get image dimensions
    width, height = overlay_img.size
    
    # Try to use a default font, fallback to basic if not available
    try:
        # Try to load larger, more visible fonts
        font_large = ImageFont.truetype("arial.ttf", size=max(28, width//30))
        font_medium = ImageFont.truetype("arial.ttf", size=max(22, width//35))
        font_small = ImageFont.truetype("arial.ttf", size=max(18, width//45))
    except:
        try:
            # Fallback fonts with larger sizes
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
        except:
            font_large = font_medium = font_small = None
    
    # Format coordinates
    lat_formatted = f"{abs(latitude):.6f}°{'N' if latitude >= 0 else 'S'}"
    lon_formatted = f"{abs(longitude):.6f}°{'E' if longitude >= 0 else 'W'}"
    
    # Format timestamp
    try:
        from datetime import datetime
        if timestamp:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            time_str = dt.strftime("%Y-%m-%d %H:%M:%S")
        else:
            time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    except:
        time_str = "Time: Unknown"
    
    # Create overlay background (semi-transparent) - make it bigger
    overlay_height = max(150, height//6)  # Taller overlay for better visibility
    overlay_y = height - overlay_height
    
    # Ensure image is in RGB mode for proper color handling
    if overlay_img.mode != 'RGB':
        overlay_img = overlay_img.convert('RGB')
    
    # Create semi-transparent black rectangle for overlay background
    # Convert to RGBA temporarily for transparency, then back to RGB
    if overlay_img.mode != 'RGBA':
        overlay_img = overlay_img.convert('RGBA')
    
    # Create transparent overlay
    overlay_bg = Image.new('RGBA', (width, overlay_height), (0, 0, 0, 200))
    
    # Paste the overlay
    overlay_img.paste(overlay_bg, (0, overlay_y), overlay_bg)
    
    # Convert back to RGB for final image
    overlay_img = overlay_img.convert('RGB')
    
    # Recreate draw object after conversion
    draw = ImageDraw.Draw(overlay_img)
    
    # Draw geo-location information
    text_color = (255, 255, 255)  # White text
    margin = max(15, width//80)  # Larger margin
    line_height = max(25, overlay_height // 6)  # Better line spacing
    
    # Always show current location info if available
    if location_info:
        # City, Region line - bright yellow for visibility
        location_text = f"📍 {location_info.get('city', 'Unknown')}, {location_info.get('region', 'Unknown')}"
        draw.text((margin, overlay_y + margin), location_text, fill=(255, 255, 0), font=font_medium)
        
        # Coordinates in standard format
        draw.text((margin, overlay_y + margin + line_height), 
                  f"🌐 {lat_formatted}, {lon_formatted}", 
                  fill=text_color, font=font_small)
        
        # Decimal coordinates for precision
        draw.text((margin, overlay_y + margin + line_height * 2), 
                  f"� {latitude:.6f}, {longitude:.6f}", 
                  fill=text_color, font=font_small)
        
        # Country info
        draw.text((margin, overlay_y + margin + line_height * 3), 
                  f"� {location_info.get('country', 'Unknown')}", 
                  fill=text_color, font=font_small)
    else:
        # Fallback to coordinates only
        draw.text((margin, overlay_y + margin), 
                  f"� {lat_formatted}, {lon_formatted}", 
                  fill=text_color, font=font_medium)
        
        draw.text((margin, overlay_y + margin + line_height), 
                  f"🌐 {latitude:.6f}, {longitude:.6f}", 
                  fill=text_color, font=font_small)
    
    # Current timestamp (always show)
    draw.text((margin, overlay_y + margin + line_height * 4), 
              f"🕒 {time_str}", 
              fill=text_color, font=font_small)
    
    # Enhanced "LIVE GEO-TAGGED" watermark - bright green
    draw.text((margin, overlay_y + margin + line_height * 5), 
              "✅ LIVE CURRENT LOCATION", 
              fill=(0, 255, 0), font=font_medium)
    
    return overlay_img

# API Routes
@app.get("/api/config", response_model=ConfigResponse)
async def get_config():
    """Provide configuration data"""
    return ConfigResponse(googleMapsApiKey=GOOGLE_MAPS_API_KEY)

@app.post("/capture", response_model=CaptureResponse)
async def capture_photo(
    user_email: str = Form(...),
    user_id: Optional[str] = Form(None),
    image_base: str = Form(...),
    timestamp: Optional[str] = Form(None)
):
    """Extract GPS data from base64 image and return comprehensive geo-location information."""
    try:
        # Validate user email
        if not user_email or "@" not in user_email:
            raise HTTPException(status_code=400, detail="Valid user email is required")
        
        # Check if image_base was provided
        if not image_base:
            raise HTTPException(status_code=400, detail="No image_base data provided")
        
        # Check if base64 data is valid format
        if len(image_base) < 100:  # Too short to be a valid image
            raise HTTPException(status_code=400, detail="Base64 image data too short")
        
        # Check for valid base64 characters
        import re
        if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', image_base.replace(',', '').split(',')[-1][:100]):
            raise HTTPException(status_code=400, detail="Invalid base64 format")
        
        # Set default timestamp if not provided or invalid
        if not timestamp or timestamp.lower() in ['string', 'null', 'none', '']:
            timestamp = datetime.datetime.now().isoformat()
        
        # Decode base64 image data
        import base64
        try:
            # Remove data URL prefix if present and validate
            original_image_base = image_base
            if ',' in image_base:
                prefix, image_base = image_base.split(',', 1)
                print(f"📄 Base64 prefix found: {prefix[:50]}")
                # Validate it's an image data URL
                if not prefix.startswith('data:image/'):
                    print(f"⚠️ Warning: Unexpected prefix format: {prefix}")
            else:
                print("📄 No data URL prefix found")
            
            # Debug: Check base64 data
            print(f"📄 Base64 data length: {len(image_base)} chars")
            print(f"📄 Base64 starts with: {image_base[:50]}...")
            print(f"📄 Base64 ends with: ...{image_base[-50:]}")
            
            # Clean base64 string and fix padding issues
            # Remove any whitespace and newlines
            image_base = ''.join(image_base.split())
            
            # Check for proper base64 characters only
            import string
            valid_chars = string.ascii_letters + string.digits + '+/='
            if not all(c in valid_chars for c in image_base):
                invalid_chars = set(image_base) - set(valid_chars)
                print(f"❌ Invalid base64 characters found: {invalid_chars}")
                raise HTTPException(status_code=400, detail=f"Invalid characters in base64: {invalid_chars}")
            
            # Fix padding - base64 length should be multiple of 4
            while len(image_base) % 4 != 0:
                # Try removing characters from the end first (common with URL truncation)
                if len(image_base) % 4 == 1:
                    # Remove the last character if it makes it invalid
                    image_base = image_base[:-1]
                    print(f"📄 Removed 1 character from end due to invalid length")
                else:
                    # Add padding
                    image_base += '='
                    print(f"📄 Added padding character")
            
            print(f"📄 Final base64 length: {len(image_base)} (multiple of 4: {len(image_base) % 4 == 0})")
            
            # Decode base64 to image bytes with better error handling
            try:
                image_bytes = base64.b64decode(image_base, validate=True)
                print(f"📏 Decoded image bytes: {len(image_bytes)} bytes")
            except Exception as decode_error:
                print(f"❌ Base64 decode error: {decode_error}")
                raise HTTPException(status_code=400, detail=f"Invalid base64 data: {decode_error}")
            
            # Try to open image with comprehensive error handling
            image_buffer = io.BytesIO(image_bytes)
            try:
                # First, check if we have enough data
                if len(image_bytes) < 100:
                    raise HTTPException(status_code=400, detail="Image data too small to be valid")
                
                # Check if this looks like actual image data
                first_bytes = image_bytes[:20]
                first_text = first_bytes.decode('ascii', errors='ignore')
                print(f"📄 First 20 bytes as hex: {first_bytes.hex()}")
                print(f"📄 First 20 bytes as text: '{first_text}'")
                
                # Check for common image format headers
                is_jpeg = image_bytes[:4] in [b'\xff\xd8\xff\xe0', b'\xff\xd8\xff\xe1', b'\xff\xd8\xff\xdb']
                is_png = image_bytes[:8] == b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a'
                is_gif = image_bytes[:6] in [b'GIF87a', b'GIF89a']
                is_webp = image_bytes[8:12] == b'WEBP'
                
                if not (is_jpeg or is_png or is_gif or is_webp):
                    # This might be test data rather than real image
                    if first_text.isascii() and len(first_text.strip()) > 0:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Data appears to be text ('{first_text.strip()[:20]}') rather than image data. Please provide valid base64-encoded image data."
                        )
                    else:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Data does not appear to be a valid image format. Expected JPEG, PNG, GIF, or WebP headers."
                        )
                
                # Try to open the image
                image = Image.open(image_buffer)
                print(f"🖼️ Original image: {image.size}, mode={image.mode}, format={image.format}")
                
                # Load the image data to ensure it's not truncated
                try:
                    image.load()
                    print("✅ Image data loaded successfully")
                except Exception as load_error:
                    print(f"❌ Image load error: {load_error}")
                    raise HTTPException(status_code=400, detail=f"Image file is corrupted or truncated: {load_error}")
                    
            except Image.UnidentifiedImageError as pil_error:
                print(f"❌ PIL UnidentifiedImageError: {pil_error}")
                print(f"📄 First 50 bytes as hex: {image_bytes[:50].hex()}")
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid image format - cannot identify image type. Please ensure you're sending valid base64-encoded image data (JPEG, PNG, GIF, or WebP)."
                )
            except HTTPException:
                # Re-raise our custom HTTP exceptions
                raise
            except Exception as pil_error:
                print(f"❌ PIL Error: {pil_error}")
                print(f"📄 Image bytes length: {len(image_bytes)}")
                print(f"📄 First 20 bytes: {image_bytes[:20]}")
                raise HTTPException(status_code=400, detail=f"Error processing image: {pil_error}")
            
            # Ensure image is in RGB mode from the start
            if image.mode != 'RGB':
                print(f"🔄 Converting image from {image.mode} to RGB")
                image = image.convert('RGB')
            
        except Exception as decode_error:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid base64 image data: {str(decode_error)}"
            )
        
        # Always get current location and time first
        current_location, current_time = get_current_location_and_time()
        print(f"🌍 Current location detected: {current_location['city']}, {current_location['region']}")
        
        # Extract GPS data from the decoded image for reference
        print(f"🔍 Extracting GPS data from base64 image for user: {user_email}")
        existing_gps = extract_existing_gps_data(image)
        
        # ALWAYS use current location (not the image GPS data)
        print(f"📍 Using CURRENT location instead of image GPS data")
        latitude = current_location['latitude']
        longitude = current_location['longitude']
        location_source = "live_current_location"
        location_info = current_location
        
        if existing_gps:
            print(f"ℹ️ Image had GPS data ({existing_gps['latitude']}, {existing_gps['longitude']}) but using current location instead")
        
        # Generate unique filename for base64 image
        file_ext = '.jpg'  # Default extension for base64 images
        if hasattr(image, 'format') and image.format:
            format_ext_map = {'JPEG': '.jpg', 'PNG': '.png', 'WEBP': '.webp', 'TIFF': '.tiff'}
            file_ext = format_ext_map.get(image.format.upper(), '.jpg')
        
        unique_filename = f"capture_{uuid.uuid4().hex}{file_ext}"
        output_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Add geo-location overlay to the image with current time
        image_with_overlay = add_geolocation_overlay(image, latitude, longitude, current_time, location_info)
        
        # Save the enhanced image with geo-location overlay
        # Ensure RGB mode before saving
        if image_with_overlay.mode != 'RGB':
            print(f"🔄 Converting final image from {image_with_overlay.mode} to RGB")
            image_with_overlay = image_with_overlay.convert('RGB')
        
        print(f"💾 Saving enhanced image: {image_with_overlay.size}, mode={image_with_overlay.mode}")
        image_with_overlay.save(output_path, quality=95)
        
        # Convert enhanced image to base64 for response
        enhanced_buffer = io.BytesIO()
        # Ensure RGB mode before saving as JPEG
        if image_with_overlay.mode != 'RGB':
            image_with_overlay = image_with_overlay.convert('RGB')
        image_with_overlay.save(enhanced_buffer, format='JPEG', quality=95)
        enhanced_buffer.seek(0)
        enhanced_base64 = base64.b64encode(enhanced_buffer.getvalue()).decode('utf-8')
        
        # Get image metadata
        file_size = len(image_bytes)
        image_width, image_height = image.size
        image_mode = image.mode
        image_format = image.format or 'JPEG'
        
        # Format coordinates for display
        lat_formatted = f"{abs(latitude):.6f}°{'N' if latitude >= 0 else 'S'}"
        lon_formatted = f"{abs(longitude):.6f}°{'E' if longitude >= 0 else 'W'}"
        
        # Format file size
        def format_file_size(size_bytes):
            if size_bytes == 0:
                return "0 B"
            size_names = ["B", "KB", "MB", "GB"]
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return f"{s} {size_names[i]}"
        
        # Parse timestamp for better display - use current_time from geolocation
        try:
            # Use current time from geolocation API
            capture_datetime = datetime.datetime.fromisoformat(current_time.replace('Z', '+00:00'))
            timestamp_to_use = current_time
        except (ValueError, AttributeError):
            # If timestamp parsing fails, use current time
            timestamp_to_use = datetime.datetime.now().isoformat()
            capture_datetime = datetime.datetime.now()
        
        # Generate Google Maps URLs and location information
        maps_url = f"https://www.google.com/maps?q={latitude},{longitude}"
        maps_embed_url = f"https://www.google.com/maps/embed/v1/place?key={GOOGLE_MAPS_API_KEY}&q={latitude},{longitude}&zoom=15"
        satellite_url = f"https://www.google.com/maps/@{latitude},{longitude},17z/data=!3m1!1e3"
        
        # Create comprehensive response
        return {
            "message": "📸 Image processed successfully with geo-location data!",
            "filename": unique_filename,
            "image_url": f"http://127.0.0.1:8000/download/{unique_filename}",
            "image_base64": enhanced_base64,  # Use enhanced image with overlay
            "user_email": user_email,
            "user_id": user_id,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
                "formatted": f"{lat_formatted}, {lon_formatted}",
                "decimal_degrees": f"{latitude}, {longitude}",
                "source": location_source
            },
            "timestamp": {
                "iso": timestamp_to_use,
                "formatted": capture_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                "date": capture_datetime.strftime("%B %d, %Y"),
                "time": capture_datetime.strftime("%I:%M:%S %p"),
                "original_image_timestamp": existing_gps.get('timestamp', 'Not available') if existing_gps else 'Not available'
            },
            "metadata": {
                "file_size": format_file_size(file_size),
                "dimensions": f"{image_width} × {image_height}",
                "format": image_format,
                "mode": image_mode,
                "width": image_width,
                "height": image_height,
                "input_type": "base64_image"
            },
            "location_info": {
                "has_gps_data": existing_gps is not None,
                "altitude": existing_gps.get('altitude', 'Not available') if existing_gps else 'Not available',
                "coordinates_accuracy": "From image EXIF data" if existing_gps else "From current location API",
                "location_source": location_source,
                "current_location_used": location_info is not None,
                "city": location_info.get('city') if location_info else 'Unknown',
                "region": location_info.get('region') if location_info else 'Unknown',
                "country": location_info.get('country') if location_info else 'Unknown'
            },
            "map_data": {
                "google_maps_url": maps_url,
                "google_maps_embed_url": maps_embed_url,
                "satellite_view_url": satellite_url,
                "static_map_url": f"https://maps.googleapis.com/maps/api/staticmap?center={latitude},{longitude}&zoom=15&size=400x400&maptype=roadmap&markers=color:red%7C{latitude},{longitude}&key={GOOGLE_MAPS_API_KEY}",
                "coordinates_for_mapping": {
                    "lat": latitude,
                    "lng": longitude
                }
            },
            "download_url": f"/download/{unique_filename}"
        }
        
    except HTTPException:
        # Re-raise HTTPExceptions (like 400 errors) without wrapping them in 500 errors
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error capturing photo: {str(e)}")

@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    timestamp: Optional[str] = Form(None)
):
    """Handle file upload and geo-tagging."""
    try:
        # Check if file was uploaded
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        if file.filename == '':
            raise HTTPException(status_code=400, detail="No file selected")
        
        # Get GPS coordinates and timestamp
        lat = latitude
        lon = longitude
        if not timestamp:
            timestamp = datetime.datetime.now().isoformat()
        
        # Read and open the image file
        file_content = await file.read()
        image = Image.open(io.BytesIO(file_content))
        
        # Check for existing GPS data - ONLY ACCEPT GEO-TAGGED IMAGES
        print(f"🔍 Upload validation for: {file.filename}")
        print(f"📊 Image info: format={image.format}, size={image.size}, mode={image.mode}")
        
        # Debug: Check if image has EXIF data at all
        if hasattr(image, 'info') and 'exif' in image.info:
            print(f"✅ Image has EXIF data (length: {len(image.info['exif'])} bytes)")
        else:
            print("⚠️ Image has no EXIF data")
        
        existing_gps = extract_existing_gps_data(image)
        has_existing_gps = existing_gps is not None
        
        # Reject images without GPS data
        if not has_existing_gps:
            print(f"❌ Upload rejected - no GPS data found in {file.filename}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "❌ Only geo-tagged images are accepted",
                    "message": "This image does not contain GPS location data. Please upload only photos taken with a camera that includes location information.",
                    "suggestion": "Try uploading photos taken with your smartphone camera (with location services enabled) or photos that already have GPS coordinates embedded.",
                    "filename": file.filename,
                    "debug_info": {
                        "image_format": image.format,
                        "has_exif": hasattr(image, 'info') and 'exif' in image.info
                    }
                }
            )
        
        print(f"✅ Upload GPS validation passed for {file.filename}: {existing_gps}")
        
        # Get image metadata
        original_filename = file.filename
        file_size = len(file_content)
        image_width, image_height = image.size
        image_mode = image.mode
        image_format = image.format or 'JPEG'
        
        # Handle different image orientations
        if hasattr(image, '_getexif'):
            exif = image._getexif()
            if exif is not None:
                orientation = exif.get(274)  # Orientation tag
                if orientation == 3:
                    image = image.rotate(180, expand=True)
                elif orientation == 6:
                    image = image.rotate(270, expand=True)
                elif orientation == 8:
                    image = image.rotate(90, expand=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1].lower()
        if not file_ext:
            file_ext = '.jpg'
        
        unique_filename = f"geo_tagged_{uuid.uuid4().hex}{file_ext}"
        output_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Add EXIF data with GPS coordinates
        exif_bytes = add_exif_data(image, lat, lon, timestamp)
        
        # Save the image with EXIF data
        image.save(output_path, exif=exif_bytes, quality=95)
        
        # Format coordinates for display
        lat_formatted = f"{abs(lat):.6f}°{'N' if lat >= 0 else 'S'}"
        lon_formatted = f"{abs(lon):.6f}°{'E' if lon >= 0 else 'W'}"
        
        # Format file size
        def format_file_size(size_bytes):
            if size_bytes == 0:
                return "0 B"
            size_names = ["B", "KB", "MB", "GB"]
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return f"{s} {size_names[i]}"
        
        # Parse timestamp for better display
        upload_datetime = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Prepare response data
        response_data = {
            "message": "Image uploaded and geo-tagged successfully!",
            "filename": unique_filename,
            "original_filename": original_filename,
            "path": output_path,
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
                "formatted": f"{lat_formatted}, {lon_formatted}",
                "available": lat != 0 or lon != 0
            },
            "timestamp": {
                "iso": timestamp,
                "formatted": upload_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                "date": upload_datetime.strftime("%B %d, %Y"),
                "time": upload_datetime.strftime("%I:%M:%S %p")
            },
            "metadata": {
                "file_size": format_file_size(file_size),
                "dimensions": f"{image_width} × {image_height}",
                "format": image_format,
                "mode": image_mode,
                "width": image_width,
                "height": image_height
            },
            "geo_tag_status": {
                "had_existing_gps": has_existing_gps,
                "existing_gps": existing_gps,
                "new_gps_added": True,
                "status": "updated" if has_existing_gps else "added"
            },
            "download_url": f"/download/{unique_filename}"
        }
        
        # Add existing GPS information if available
        if has_existing_gps:
            response_data["message"] = "Image already had GPS data - updated with new coordinates!"
            existing_lat_formatted = f"{abs(existing_gps['latitude']):.6f}°{'N' if existing_gps['latitude'] >= 0 else 'S'}"
            existing_lon_formatted = f"{abs(existing_gps['longitude']):.6f}°{'E' if existing_gps['longitude'] >= 0 else 'W'}"
            response_data["existing_coordinates"] = {
                "latitude": existing_gps['latitude'],
                "longitude": existing_gps['longitude'],
                "formatted": f"{existing_lat_formatted}, {existing_lon_formatted}",
                "timestamp": existing_gps.get('timestamp', 'Unknown'),
                "altitude": existing_gps.get('altitude')
            }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/download/{filename}")
async def download_image(filename: str):
    """Download/view saved images"""
    from fastapi.responses import FileResponse
    import os
    
    # Security check: only allow files from uploads directory
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Cache-Control": "public, max-age=3600"
        }
    )

if __name__ == '__main__':
    import uvicorn
    print("🚀 Minimal Geo-Tagging API Server Starting...")
    print("📍 Essential endpoints: /upload and /api/config")
    print("🌐 Access at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
