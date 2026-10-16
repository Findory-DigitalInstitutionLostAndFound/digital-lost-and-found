from fastapi import APIRouter, Depends, Request, HTTPException, Form, UploadFile, File
from app.schemas.items_schema import FoundItemCreateSchema
from app.service.sensitive_data_service import is_sensitive_text
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from typing import Optional
from app.routers.auth import get_current_user
from app.service.found_items_service import FoundItemsService

router = APIRouter()

@router.post("/found-items")
async def create_found_item(
    request: Request, 
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    tags: Optional[str] = Form(None),          
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
    ):
    
    # ========== Basic validation ==========
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")

    if not description.strip():
        raise HTTPException(status_code=400, detail="Description is required.")

    if not location.strip():
        raise HTTPException(status_code=400, detail="Location is required.")

    if not date_found.strip():
        raise HTTPException(status_code=400, detail="Date found is required.")

    if not category.strip():
        raise HTTPException(status_code=400, detail="Category is required.")

    #==========AI analysing and description cleaning==========#
    
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

   #=======From here start to save the found item to the database====#

    # get the user id
    user_id = current_user.get("sub")
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]  # Convert comma-separated string to list

    item_data = FoundItemCreateSchema(
        user_id =  user_id,
        item_type = "found",
        title = title,
        description = description,
        public_description = public_description,
        category = category,
        location_name = location,
        event_timestamp = date_found,
        is_high_valued = gemini_result.get("is_high_value", False),
        has_sensitive_data= gemini_result.get("has_sensitive_data", False),
        original_image_url = None, 
        blurred_image_url = None,  
        ai_tags = tag_list, 
        status = "open" 
    )

    # Save to db
    saved_item = FoundItemsService.save_item(item_data)


    # If we get here, the description is clean,then
    return {
        "status": "success",
        "message": "Found item created successfully.",
        "item_id": saved_item.get("id"),
        "public_description": public_description,
        "has_sensitive_data": gemini_result.get("has_sensitive_data", False),
        "is_high_value": gemini_result.get("is_high_value", False),
        "ai_tags": tag_list
    }
