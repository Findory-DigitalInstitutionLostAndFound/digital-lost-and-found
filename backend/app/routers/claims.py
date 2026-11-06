from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_user
from app.service.fetch_claims_details_service import FetchClaimsDetailsService

router = APIRouter()

@router.get("/claims")
async def get_claims(request: Request, current_user: dict = Depends(get_current_user)):
    # get access token from the request cookies
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")

    # get user id
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    # Fetch claims( if the current user is the claiment)
    claims_as_claimant = await FetchClaimsDetailsService.fetch_claims_details_as_claimant(user_id, token)

    # Fetch claims( if the current user is the founder)
    claims_as_founder = await FetchClaimsDetailsService.fetch_claims_details_as_founder(user_id, token)

    return {
        "claims_as_claimant": claims_as_claimant,
        "claims_as_founder": claims_as_founder
    }
    
