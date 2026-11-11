from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_user
from app.service.fetch_items_service import FetchItemsService

router = APIRouter()

#if a authenticated user fetch all items, if a guest user fetch only items match to his lost item tags
@router.get("/items")
async def get_items(request: Request, current_user: dict = Depends(get_current_user)):
    # get access token from the request cookies
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")

    items = await FetchItemsService.fetch_items(token)
    return items
