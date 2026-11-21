from fastapi import HTTPException, Request
from app.api.deps import get_current_user
from app.core.supabase_user import get_user_supabase_client
from app.core.supabase_admin import get_admin_supabase_client
from app.service.guest_items_service import GuestItemsService, GUEST_COOKIE_NAME


async def resolve_claim_actor(request: Request) -> dict:
    # 1. Try registered user if access_token cookie is present
    access_token = request.cookies.get("access_token")
    if access_token:
        try:
            current_user = await get_current_user(request)
            user_id = current_user.get("sub")
            if user_id:
                return {
                    "auth_type": "user",
                    "actor_id": user_id,
                    "access_token": access_token,
                    "supabase": get_user_supabase_client(access_token),
                }
        except HTTPException:
            # Token may be stale/expired while a guest session is active; fall through
            pass

    # 2. Try guest session cookie
    guest_token = request.cookies.get(GUEST_COOKIE_NAME)
    if guest_token:
        guest, _ = GuestItemsService.get_guest_and_item_by_token(guest_token)
        guest_id = guest.get("id")
        if guest_id:
            return {
                "auth_type": "guest",
                "actor_id": str(guest_id),
                "access_token": None,
                "supabase": get_admin_supabase_client(),
            }

    raise HTTPException(status_code=401, detail="Not authenticated.")