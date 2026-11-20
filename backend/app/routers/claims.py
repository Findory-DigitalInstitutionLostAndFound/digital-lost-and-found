from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile, File
from app.api.deps import get_current_user
from app.service.fetch_claims_details_service import FetchClaimsDetailsService
from app.service.update_claims_service import UpdateClaimsService
from app.schemas.claim_schema import StatusUpdateSchema, MeetupUpdateSchema
from typing import Optional
from app.api.claim_auth import resolve_claim_actor

router = APIRouter()

# Endpoint to fetch claims for the current user
@router.get("/claims")
async def get_claims(request: Request):
    actor = await resolve_claim_actor(request)
    
    # Fetch claims( if the current user is the claiment)
    claims_as_claimant = await FetchClaimsDetailsService.fetch_claims_details_as_claimant(actor)

    # Fetch claims( if the current user is the founder)
    claims_as_founder = await FetchClaimsDetailsService.fetch_claims_details_as_founder(actor)

    return {
        "claims_as_claimant": claims_as_claimant,
        "claims_as_founder": claims_as_founder
    }

# Endpoint to update the last read time
@router.post("/claims/{claim_id}/update-last-read")
async def update_last_read(
    claim_id: str, 
    request: Request,
):
    actor = await resolve_claim_actor(request)
    try:
        await UpdateClaimsService.update_last_read_time(claim_id, actor)
        return {"status": "success", "message": "Last read time updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# endpoint to update claim status
@router.post("/claims/{claim_id}/update-status")
async def update_claim_status(
    claim_id: str,
    payload: StatusUpdateSchema,
    request: Request
):
    actor = await resolve_claim_actor(request)
    try:
        updated_claim = await UpdateClaimsService.update_claim_status(claim_id, actor, payload.status)
        return {"status": "success", "data": updated_claim}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# endpoint to send a message in a claim
@router.post("/claims/{claim_id}/send-message")
async def send_message(
    claim_id: str,
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),   
    request: Request = None,
):
    actor = await resolve_claim_actor(request)
    
    image_url = None
    # if there is a image, it will be uploaded first
    try:
        if image:
            # Upload the image and get the URL
            image_upload_result = await UpdateClaimsService.upload_message_image(image, actor["supabase"])
            image_url = image_upload_result.get("public_url")
    
        message_data = await UpdateClaimsService.send_message(
            claim_id = claim_id, 
            content = content, 
            image_url = image_url, 
            actor = actor
        )
        return {"status": "success", "data": message_data}
    except HTTPException as http_exc:
        raise http_exc 
    except Exception as e:
        raise HTTPException(status_code=500, detail= f"Internal server error while sending message: {str(e)}")

# update meetup location and time
@router.post("/claims/{claim_id}/update-meetup")
async def update_meetup(
    claim_id: str,
    payload: MeetupUpdateSchema,
    request: Request,
):
    actor = await resolve_claim_actor(request)
    
    try:
        updated = await UpdateClaimsService.update_meetup(
            claim_id=claim_id,
            meetup_location=payload.location,
            meetup_time=payload.time,
            actor=actor,
        )
        return {"status": "success", "data": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# accept meetup location and time
@router.post("/claims/{claim_id}/accept-meetup")
async def accept_meetup(
    claim_id: str,
    request: Request,
):
    actor = await resolve_claim_actor(request)

    try:
        updated = await UpdateClaimsService.accept_meetup(
            claim_id=claim_id,
            actor=actor
        )
        return {"status": "success", "data": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))