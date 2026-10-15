from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
import easyocr # For Optical Character Recognition (OCR)
from presidio_analyzer import AnalyzerEngine # For sensitive data detection
from app.core.pii import create_pii_analyzer # Custom function to create a Presidio analyzer with Finnish PII recognizer
from app.routers.found_item import router as found_item_router

# create fast api
app = FastAPI(title="Digital Lost and Found API")  

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",],  
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# include auth router
app.include_router(auth_router)
# include found item router
app.include_router(found_item_router)


# Initialize heavy models only at startup to avoid reloading them on every request
ocr_reader = easyocr.Reader(['en'])  # Load the OCR model 


# Make them available to the rest of the app
app.state.ocr_reader = ocr_reader
app.state.pii_analyzer = create_pii_analyzer()

@app.get('/')
def home():
    return({"message": "Welcome to the Digital Lost and Found API"}) 