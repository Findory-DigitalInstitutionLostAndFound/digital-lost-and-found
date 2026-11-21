from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from app.api.deps import get_current_user
from app.service.create_claim_service import CreateClaimService
from app.schemas.claim_schema import CreateClaimSchema
from app.api.claim_auth import resolve_claim_actor

router = APIRouter()

@router.post("/create-claim")
async def create_claim(
    request: Request, 
    payload: CreateClaimSchema,
    background_tasks: BackgroundTasks = None
):
    # validate the item_id
    if not payload.item_id.strip():
        raise HTTPException(status_code=400, detail="Item ID is required.")

    # to get user 
    actor = await resolve_claim_actor(request)

    gemini_client = request.app.state.gemini_client
    openrouter_client = request.app.state.openrouter_client

    # verify item really exists, get details and create a new claim
    result = await CreateClaimService.process_claim(
        item_id = payload.item_id,  
        actor = actor,
        gemini_client = gemini_client,
        openrouter_client = openrouter_client,
        background_tasks=background_tasks
    )

    return result
