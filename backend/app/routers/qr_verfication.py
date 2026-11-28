from fastapi import APIRouter, Depends, HTTPException, Request
import secrets
from datetime import datetime, timedelta, timezone
from app.api.deps import get_current_user
from app.service.qrServices import QrService
from app.schemas.claim_schema import QRVerifyRequest
from app.api.claim_auth import resolve_claim_actor

router = APIRouter(tags=["Claims"])
# route to generate QR code for a approved claim
@router.post("/claims/{claim_id}/generate_qr")
async def generate_qr_code(
    claim_id: str, 
    request: Request,
): 
    actor = await resolve_claim_actor(request)
 
    # Generate QR code logic 
    secure_token = secrets.token_urlsafe(32)
    # Set expiration time for the QR code
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=1.5)  # QR code valid for 1.5 minutes

    result = await QrService.update_claim_qr(
        claim_id=claim_id, 
        actor=actor,
        qr_token=secure_token,
        expires_at=expires_at.isoformat(), 
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to save QR token.")
    
    return {
        "status": "success",
        "qr_token": secure_token, 
        "expires_at": expires_at.isoformat(),
        "qr_payload": f"findory:handover:{claim_id}:{secure_token}"
    }