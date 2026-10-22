from fastapi import APIRouter, Depends, Request, HTTPException, Form, UploadFile, File, BackgroundTasks
from app.schemas.items_schema import ItemCreateSchema
from app.service.sensitive_data_service import is_sensitive_text
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from typing import Optional
from app.routers.auth import get_current_user
from app.service.create_items_service import CreateItemsService
from app.service.image_redaction_service import redact_sensitive_areas
import uuid

router = APIRouter()

@router.post("/create-items")
async def create_found_item(
    request: Request, 
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    tags: Optional[str] = Form(None),          
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    mode: str = Form(...)
    ):
    # Get the access token from the request cookies
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    

    # ========== Basic validation ==========
    if mode.strip() not in ["found", "lost"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'found' or 'lost'.")
    if mode == "":
        raise HTTPException(status_code=400, detail="Mode is required.")
    
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

   #=======From here start to save the items to the database====#

    # get the user id
    user_id = current_user.get("sub")
    tag_list = []
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]  # Convert comma-separated string to list

    if image:
        # read the image only once
        image_bytes = await image.read()
        await image.seek(0)  # Reset the file pointer to the beginning for further use

        # Get the original image URL if an image was uploaded
        upload_original_image = await CreateItemsService.upload_original_image(image, token)
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
        upload_cleaned_image = await CreateItemsService.upload_cleaned_image(cleaned_bytes, token)
        print("\nCleaned image upload response:", upload_cleaned_image)
        cleaned_image_url = upload_cleaned_image.get("public_url")
        print("\nCleaned image URL:", cleaned_image_url)
    else:
        original_image_url = None
        cleaned_image_url = None

    item_data = ItemCreateSchema(
        user_id =  user_id,
        item_type = mode,
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
    saved_item = CreateItemsService.save_item(item_data, token)


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
            f"{mode} item created, but the public description might still contain sensitive data. "
            "Please review and edit it in your profile."
        )
    else:
        response["message"] = f"{mode} item created successfully.."

    print("\nFinal response to be returned:", response)

    return response

# Guest item creation endpoint
@router.post("/guest/create-item")
async def create_guest_item(
    request: Request,
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    guest_name: str = Form(...),
    guest_email: str = Form(...),
    guest_phone: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),          
    image: Optional[UploadFile] = File(None),
):
    # Validation
    if not title.strip() or not description.strip() or not guest_email.strip() or not guest_name.strip():
        raise HTTPException(status_code=400, detail="Required fields are missing.")

    # AI Analysis & Description Cleaning (Reuses app state clients)
    analyzer = request.app.state.pii_analyzer
    gemini_client = request.app.state.gemini_client
    openrouter_client = request.app.state.openrouter_client

    description = description.strip()
    gemini_result = analyze_text_for_sensitive_data(description, gemini_client, openrouter_client)
    public_description = gemini_result.get("public_description") or description

    # Handle Image Upload & Redaction 
    original_image_url = None
    cleaned_image_url = None

    if image:
        image_bytes = await image.read()
        await image.seek(0)
        
        upload_orig = await CreateItemsService.upload_guest_original_image(image)
        original_image_url = upload_orig.get("public_url")

        reader = request.app.state.ocr_reader
        jewellery_categories = {"ring", "rings", "jewellery", "jewelry", "necklace", "bracelet", "watch", "earring"}
        id_categories = {"id", "identity", "passport", "license", "card", "henkilökortti"}
        
        force_all = (
            category.strip().lower() in jewellery_categories
            or category.strip().lower() in id_categories
            or gemini_result.get("is_high_value", False)
        )

        cleaned_bytes = redact_sensitive_areas(image_bytes, reader, analyzer, force_redact_all_text=force_all)
        upload_clean = await CreateItemsService.upload_guest_cleaned_image(cleaned_bytes)
        cleaned_image_url = upload_clean.get("public_url")

    # Generate Match Token and parse tags
    match_token = str(uuid.uuid4())
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []

    # Build dictionary and save using guest service method
    item_data = ItemCreateSchema(
        user_id=None,
        item_type="lost",
        title=title,
        description=description,
        public_description=public_description,
        category=category,
        location_name=location,
        event_timestamp=date_found,
        is_high_valued=gemini_result.get("is_high_value", False),
        has_sensitive_data=gemini_result.get("has_sensitive_data", False),
        ai_tags=tag_list,
        original_image_url=original_image_url,
        blurred_image_url=cleaned_image_url,
        status="open",
        guest_name=guest_name,
        guest_email=guest_email,
        guest_phone=guest_phone,
        match_token=match_token
    )

    saved_item = CreateItemsService.save_guest_item(item_data)

    # Queue email dispatch in background
    match_link = f"https://findory.app/guest/matches?token={match_token}"
    background_tasks.add_task(
        send_guest_match_email,
        email=guest_email,
        name=guest_name,
        match_link=match_link,
        item_title=title
    )

    return {
        "status": "success",
        "item_id": saved_item.get("id"),
        "message": "Guest report submitted successfully! Check your email for your match link."
    }

def send_guest_match_email(email: str, name: str, match_link: str, item_title: str):
    # Implement email transmission logic 
    print(f"Sending match link email to {email} for item '{item_title}': {match_link}")