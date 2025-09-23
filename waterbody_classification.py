from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import base64

# --- 1. DEFINE APP AND DATA MODELS ---

# Initialize the FastAPI app
app = FastAPI(
    title="Waterbody Detection API",
    description="An API with two endpoints to detect waterbodies in images.",
    version="2.0.0"
)

# Pydantic model for the Base64 request body
class Base64Request(BaseModel):
    user_email: str
    user_id: str
    image_base64: str

# Pydantic model for the API response
class PredictionResponse(BaseModel):
    user_email: str
    user_id: str
    prediction: str
    confidence: float
    error: str | None = None


# --- 2. LOAD THE MODEL (ONCE ON STARTUP) ---

MODEL_PATH = os.path.join('model', 'waterbody_classification.keras')
model = None

@app.on_event("startup")
def load_model():
    """Load the Keras model once when the application starts."""
    global model
    print(f"Loading model from: {MODEL_PATH}")
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
    except Exception as e:
        print(f"CRITICAL ERROR: Model failed to load: {e}")
        model = None


# --- 3. THE CORE PREDICTION LOGIC (USED BY BOTH ENDPOINTS) ---

def process_and_predict(image_bytes: bytes) -> dict:
    """
    Takes image bytes, preprocesses the image, and returns a prediction.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not available.")

    try:
        IMG_SIZE = 224
        img = Image.open(io.BytesIO(image_bytes)).resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img)

        if img_array.shape[2] == 4: # Handle PNG with alpha channel
            img_array = img_array[:, :, :3]

        img_batch = np.expand_dims(img_array, axis=0)
        prediction_value = model.predict(img_batch)[0][0]

        # --- THE FIX IS HERE: ADJUSTED CONFIDENCE THRESHOLD ---
        # Instead of a simple 50% cutoff, we now require the model to be at least
        # 75% confident to classify an image as a waterbody. This will help
        # reject incorrect classifications of things like cars or glass buildings.
        CONFIDENCE_THRESHOLD = 0.75 

        if prediction_value > CONFIDENCE_THRESHOLD:
            return {"prediction": "Waterbody", "confidence": float(prediction_value)}
        else:
            # We report the original prediction as 'No Waterbody' if it's below our threshold.
            # The confidence is still based on the original score.
            predicted_class = "No Waterbody"
            confidence_score = 1 - prediction_value
            return {"prediction": predicted_class, "confidence": float(confidence_score)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")


# --- 4. DEFINE THE TWO API ENDPOINTS ---

@app.post("/predict/upload-file/", response_model=PredictionResponse, tags=["Prediction"])
async def predict_with_file_upload(
    file: UploadFile = File(..., description="The image file to be classified."),
    user_email: str = Form(..., description="Email of the user."),
    user_id: str = Form(..., description="Unique ID of the user.")
):
    """
    Endpoint for uploading a normal image file (`multipart/form-data`).
    """
    contents = await file.read()
    result = process_and_predict(contents)
    
    return PredictionResponse(
        user_email=user_email,
        user_id=user_id,
        **result
    )


@app.post("/predict/upload-base64/", response_model=PredictionResponse, tags=["Prediction"])
async def predict_with_base64(item: Base64Request):
    """
    Endpoint for uploading a Base64 encoded image string in a JSON body.
    """
    try:
        # Decode the base64 string into bytes
        image_bytes = base64.b64decode(item.image_base64)
    except (base64.binascii.Error, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid Base64 string: {e}")

    result = process_and_predict(image_bytes)
    
    return PredictionResponse(
        user_email=item.user_email,
        user_id=item.user_id,
        **result
    )

