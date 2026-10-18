from fastapi import Request, HTTPException
from app.service.auth_service import AuthService

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return AuthService.verify_and_get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid")