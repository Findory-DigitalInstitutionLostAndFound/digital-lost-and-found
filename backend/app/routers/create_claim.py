from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from app.api.deps import get_current_user
from app.service.create_claim_service import CreateClaimService

router = APIRouter()

@router.post("/create-claim")
async def create_claim(
    request: Request, 
    item_id: str,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    # Get the access token from the request cookies
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")
   
    # validate the item_id
    if not item_id.strip():
        raise HTTPException(status_code=400, detail="Item ID is required.")

    # get user id
    user_id = current_user.get("sub") 
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    gemini_client = request.app.state.gemini_client
    openrouter_client = request.app.state.openrouter_client

    # verify item really exists, get details and create a new claim
    result = await CreateClaimService.process_claim(
        item_id, 
        token, 
        user_id,
        gemini_client,
        openrouter_client,
        background_tasks=background_tasks
    )

    return result
