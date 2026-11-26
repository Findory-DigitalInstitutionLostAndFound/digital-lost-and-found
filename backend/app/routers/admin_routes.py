import os
from fastapi import APIRouter, Header, HTTPException, Request
from app.service.cleanup_service import cleanup_old_item_images
from app.service.admin_service import AdminService
from app.api.deps import get_current_user
from app.schemas.admin_schema import AssignAdminListSchema, DropOffQRSchema, UpdateAdminSchema

router = APIRouter(tags=["Admin"])

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
    if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
        
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user session. User ID is missing.")

    
    # Fetch all staff users using the access token
    staff_users = await AdminService.fetch_all_staff_users(access_token=access_token, user_id=user_id)
    
    return {"staff_users": staff_users}

# Route to assign admin role to a staff user
@router.post("/admin/assign-admin-role")
async def assign_admin_role(request: Request, payload: AssignAdminListSchema):
    access_token = request.cookies.get("access_token")
    if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user session. User ID is missing.")
    
    # Assign admin role to the specified staff user
    result = await AdminService.assign_admin_role(access_token=access_token, user_id=user_id, payload=payload)
    
    return {"message": result}

# Route to update the admin role of a staff user
@router.post("/admin/update-admin-role")
async def update_admin_role(request: Request, payload: UpdateAdminSchema):
    access_token = request.cookies.get("access_token")
    if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user session. User ID is missing.")
    
    # Update the admin role of the specified staff user
    result = await AdminService.update_admin_role(access_token=access_token, user_id=user_id, payload=payload)
    
    return {"message": result}

#Route to confirm item dropoff(when item dropoff anim scans the QR code of the item, it will trigger this route to update the custody status of the item to "ready for pickup")
@router.post("/admin/confirm-item-dropoff")
async def confirm_item_dropoff(request: Request, payload: DropOffQRSchema):
    access_token = request.cookies.get("access_token")
    if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user session. User ID is missing.")
    
    # Confirm item dropoff and update custody status
    result = await AdminService.confirm_item_dropoff(access_token=access_token, user_id=user_id, qr_token=payload.qr_token)
    
    return {"message": result}

@router.post("/admin/verify_qr_handover")
async def verify_qr_handover(request: Request, payload: DropOffQRSchema):
    access_token = request.cookies.get("access_token")
    if not access_token:
            raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
    
    current_user = await get_current_user(request)
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user session. User ID is missing.")
    
    # Verify QR code and complete handover
    result = await AdminService.verify_qr_handover(access_token=access_token, user_id=user_id, qr_token=payload.qr_token)
    
    return {"message": result}