from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_user
from app.service.fetch_items_service import FetchItemsService
from app.service.guest_items_service import GUEST_COOKIE_NAME, GuestItemsService

router = APIRouter(tags=["Items"])

#if a authenticated user fetch all items, if a guest user fetch only items match to his lost item tags
@router.get("/items")
async def get_items(request: Request):
    # get access token from the request cookies
    token = request.cookies.get("access_token")
    guest_token = request.cookies.get(GUEST_COOKIE_NAME)
    
    if not token and not guest_token:
        raise HTTPException(status_code=401, detail="Not authenticated. Access token is missing.")

    if token:
        # Authenticated user
        return await FetchItemsService.fetch_items(token)
        
    if guest_token:
        # Validate guest_token and fetch their lost_item row first
        _, lost_item = GuestItemsService.get_guest_and_item_by_token(guest_token)
        return await FetchItemsService.fetch_guest_items(lost_item)
