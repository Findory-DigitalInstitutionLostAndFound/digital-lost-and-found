from fastapi import APIRouter, Depends, Request, HTTPException, Form, UploadFile, File, BackgroundTasks
from app.schemas.items_schema import ItemCreateSchema
from app.service.sensitive_data_service import is_sensitive_text
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from typing import Optional
from app.api.deps import get_current_user
from app.service.create_items_service import CreateItemsService
from app.service.image_redaction_service import redact_sensitive_areas

router = APIRouter(tags=["Items"])

@router.post("/create-items")
async def create_item(
    request: Request, 
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    tags: Optional[str] = Form(None),          
    image: Optional[UploadFile] = File(None),
    drop_off_location: Optional[str] = Form(None),
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

    if mode.strip() == "found" and (not drop_off_location or not drop_off_location.strip()):
        raise HTTPException(status_code=400, detail="Drop off location is required for found items.") 
    
    # Validate the description to ensure it is not empty
    description = description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    # get an generic description as the public description, as fallback if background task fails
    public_description = CreateItemsService.generic_public_description(mode, category)
    
   #=======From here start to save the items to the database====#

    # get the user id
    user_id = current_user.get("sub")
    # get the role of the user who is creating the item
    role_info = CreateItemsService.get_user_role_info(user_id, token)
    is_admin = role_info.get("uni_role") == "admin"

    # Determine custody_status & drop_off_location
    if mode.strip().lower() == "found":
        resolved_drop_off = drop_off_location.strip()
        custody_status = "available_for_pickup" if is_admin else "on_the_way"
    else:
        resolved_drop_off = None
        custody_status = None
    
    tag_list = []
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]  # Convert comma-separated string to list

    image_bytes = None
    original_image_url = None
    if image:
        # read the image only once
        image_bytes = await image.read()
        await image.seek(0)  # Reset the file pointer to the beginning for further use

        # Get the original image URL if an image was uploaded
        upload_original_image = await CreateItemsService.upload_original_image(image, token)
        original_image_url = upload_original_image.get("public_url")
        

    item_data = ItemCreateSchema(
        user_id =  user_id,
        item_type = mode.strip().lower(),
        title = title.strip(),
        description = description.strip(),
        public_description = public_description,
        category = category.strip(),
        location_name = location,
        event_timestamp = date_found,
        original_image_url = original_image_url,
        blurred_image_url = None,  
        ai_tags = tag_list, 
        status = "open",
        drop_off_location = resolved_drop_off,
        custody_status = custody_status
    )

    # Save to db
    saved_item = CreateItemsService.save_item(item_data, token)
    item_id = saved_item.get("id")

    background_tasks.add_task(
        CreateItemsService.process_redaction_in_background,
        item_id=item_id,
        description=description.strip(),
        category=category.strip(),
        image_bytes=image_bytes,
        mode=mode.strip().lower(),
        original_image_url=original_image_url,
        access_token=token,
        analyzer=request.app.state.pii_analyzer,
        gemini_client=request.app.state.gemini_client,
        openrouter_client=request.app.state.openrouter_client,
        ocr_reader=request.app.state.ocr_reader
    )

    # decide the message based on the mode and whether the user is an admin
    if mode.strip().lower() == "found" and not is_admin:
        message = (
            "Found item recorded with status 'on_the_way'. You can view your item under your profile "
            "and use its QR code when dropping it at the service point. The platform does not guarantee "
            "legal outcomes if you do not hand over a found item at campus."
        )
    elif mode.strip().lower() == "found" and is_admin:
        message = "Found item recorded directly at the service point and marked available for pickup."
    else:
        message = "Lost item created successfully."


    return {
        "status": "success",
        "item_id": item_id,
        "custody_status": custody_status,
        "drop_off_location": resolved_drop_off,
        "ai_tags": tag_list,
        "message": message
    }

