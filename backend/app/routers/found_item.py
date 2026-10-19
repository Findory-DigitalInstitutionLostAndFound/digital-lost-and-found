from fastapi import APIRouter, Depends, Request, HTTPException, Form, UploadFile, File
from app.schemas.items_schema import FoundItemCreateSchema
from app.service.sensitive_data_service import is_sensitive_text
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from typing import Optional
from app.routers.auth import get_current_user
from app.service.found_items_service import FoundItemsService
from app.service.image_redaction_service import redact_sensitive_areas

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
    print("Public description after Gemini cleaning:", public_description)
    # Double check the cleaned description with Presidio to ensure no sensitive data remains\
    needs_review = is_sensitive_text(public_description, analyzer)

   #=======From here start to save the found item to the database====#

    # get the user id
    user_id = current_user.get("sub")
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]  # Convert comma-separated string to list

    if image:
        # read the image only once
        image_bytes = await image.read()
        await image.seek(0)  # Reset the file pointer to the beginning for further use

        # Get the original image URL if an image was uploaded
        upload_original_image = await FoundItemsService.upload_original_image(image)
        original_image_url = upload_original_image.get("public_url")

        # Create cleaned img
        reader = request.app.state.ocr_reader
        analyzer = request.app.state.pii_analyzer

        # Determine if the category is related to jewellery or if the item is high value
        jewellery_categories = {"ring", "rings", "jewellery", "jewelry", "necklace", "bracelet", "watch", "earring"}

        force_all = (
            category.strip().lower() in jewellery_categories
            or gemini_result.get("is_high_value", False)
        )

        # Determine if the category is related to ID or identity documents
        id_categories = {"id", "identity", "passport", "license", "card", "henkilökortti"}

        force_all = (
            category.strip().lower() in jewellery_categories
            or category.strip().lower() in id_categories
            or gemini_result.get("is_high_value", False)
        )

        cleaned_bytes = redact_sensitive_areas(
            image_bytes, 
            reader, 
            analyzer,
            force_redact_all_text=force_all
        )

        # Upload cleaned image 
        upload_cleaned_image = await FoundItemsService.upload_cleaned_image(cleaned_bytes)
        print("\nCleaned image upload response:", upload_cleaned_image)
        cleaned_image_url = upload_cleaned_image.get("public_url")
        print("\nCleaned image URL:", cleaned_image_url)
    else:
        original_image_url = None
        cleaned_image_url = None

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
        original_image_url = original_image_url,
        blurred_image_url = cleaned_image_url,  
        ai_tags = tag_list, 
        status = "open" 
    )

    # Save to db
    saved_item = FoundItemsService.save_item(item_data)


    # If we get here, the description is clean,then
    response = {
        "status": "success",
        "item_id": saved_item.get("id"),
        "public_description": public_description,
        "has_sensitive_data": gemini_result.get("has_sensitive_data", False),
        "is_high_value": gemini_result.get("is_high_value", False),
        "ai_tags": tag_list
    }
    if needs_review:
        response["message"] = (
            "Found item created, but the public description might still contain sensitive data. "
            "Please review and edit it in your profile."
        )
    else:
        response["message"] = "Found item created successfully."

    return response
