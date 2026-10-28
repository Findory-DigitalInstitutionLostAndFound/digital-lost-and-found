from fastapi import APIRouter, Request, HTTPException, Form, UploadFile, File, BackgroundTasks
from app.schemas.items_schema import ItemCreateSchema
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from app.service.guest_items_service import GuestItemsService
from app.service.image_redaction_service import redact_sensitive_areas
from typing import Optional
import uuid

router = APIRouter()

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
        
        upload_orig = await GuestItemsService.upload_guest_original_image(image)
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
        upload_clean = await GuestItemsService.upload_guest_cleaned_image(cleaned_bytes)
        cleaned_image_url = upload_clean.get("public_url")

    # Generate Match Token and parse tags
    guest_match_token = str(uuid.uuid4())
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
        guest_match_token=guest_match_token
    )

    # Bundle guest details for the 'guests' table
    guest_info = {
        "full_name": guest_name,
        "email": guest_email,
        "phone": guest_phone
    }

    saved_item = GuestItemsService.save_guest_item(item_data, guest_info)

    # Queue email dispatch in background
    match_link = f"https://findory.app/guest/matches?token={guest_match_token}"
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