from fastapi import APIRouter, Response, Request, HTTPException, Form, UploadFile, File
from app.schemas.items_schema import FoundItemRequestSchema
from app.service.sensitive_data_service import is_sensitive_text
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from typing import Optional

router = APIRouter()

@router.post("/found-items")
async def create_found_item(
    request: Request, 
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    tags: str = Form(...),          
    image: Optional[UploadFile] = File(None)):
    
    # Get the prsidio analyzer, gemini and openrouter clients that were loaded at startup
    analyzer = request.app.state.pii_analyzer
    gemini_client = request.app.state.gemini_client
    openrouter_client = request.app.state.openrouter_client

    # Validate the description to ensure it is not empty
    description = description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    # Analyze the description for sensitive data using the Gemini client first
    gemini_result = analyze_text_for_sensitive_data(description, gemini_client, openrouter_client)
    print("Gemini analysis result:", gemini_result)

    # Use the cleaned text that Gemini returned
    public_description = gemini_result.get("public_description") or description  # Fallback to original if cleaned_text is not available

    # Double check the cleaned description with Presidio to ensure no sensitive data remains
    if is_sensitive_text(public_description, analyzer):
        return {
            "status": "rejected",
            "message": "The description contains sensitive data.Please remove names, codes, serial numbers, ids, HETU before submitting."
        }

    # If we get here, the description is clean,then
    return {
        "status": "accepted",
        "message": "The description is clean. Your found item has been successfully submitted.",
        "cleaned_description": public_description,
        "gemini_analysis": gemini_result
    }
