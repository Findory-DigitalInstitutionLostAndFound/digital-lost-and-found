import os
from fastapi import APIRouter, Header, HTTPException
from app.service.cleanup_service import cleanup_old_item_images

router = APIRouter()

# Route to trigger the cleanup of old item images
@router.post("/cleanup-item-images")
async def run_image_cleanup(x_cron_secret: str = Header(None)):
    if x_cron_secret != os.getenv("CRON_SECRET"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return cleanup_old_item_images()