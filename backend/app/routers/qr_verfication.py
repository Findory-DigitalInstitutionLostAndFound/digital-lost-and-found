from fastapi import APIRouter, Depends, HTTPException, Request
import secrets
from datetime import datetime, timedelta, timezone
from app.api.deps import get_current_user
from app.service.qrServices import QrService

router = APIRouter()

@router.post("/{claim_id}/generate_qr")
async def generate_qr_code(
    claim_id: str, 
    request: Request,
    current_user: dict = Depends(get_current_user)
): 
    access_token = request.cookies.get("access_token")
    user_id = current_user.get("sub")

    if not access_token or not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Generate QR code logic 
    secure_token = secrets.token_urlsafe(32)
    # Set expiration time for the QR code
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=1.5)  # QR code valid for 1.5 minutes

    result = await QrService.update_claim_qr(
        claim_id=claim_id, 
        user_id=user_id,
        qr_token=secure_token,
        expires_at=expires_at.isoformat(), 
        access_token=access_token)

    if not result:
        raise HTTPException(status_code=500, detail="Failed to save QR token.")
    
    return {
        "status": "success",
        "qr_token": secure_token, 
        "expires_at": expires_at.isoformat(),
        "qr_payload": f"findory:handover:{claim_id}:{secure_token}"
    }