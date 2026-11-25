import os
from fastapi import APIRouter, Header, HTTPException, Request
from app.service.cleanup_service import cleanup_old_item_images
from app.service.admin_service import AdminService
from app.api.deps import get_current_user

router = APIRouter()

# Route to trigger the cleanup of old item images
@router.post("/cleanup-item-images")
async def run_image_cleanup(x_cron_secret: str = Header(None)):
    if x_cron_secret != os.getenv("CRON_SECRET"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return cleanup_old_item_images()


#fetch all the staff user data to assign the admins
@router.get("/admin/fetch-all-staff-users")
async def fetch_all_staff_users(request: Request):
    access_token = request.cookies.get("access_token")
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")

    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    
    # Fetch all staff users using the access token
    staff_users = await AdminService.fetch_all_staff_users(access_token=access_token, user_id=user_id)
    
    return {"staff_users": staff_users}