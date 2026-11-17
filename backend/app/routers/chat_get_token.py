from fastapi import Request, HTTPException, APIRouter, Depends

router = APIRouter()

@router.get("/auth/realtime-token")
async def get_realtime_token(request: Request):
    # Get the Supabase access token from the httpOnly cookie
    token = request.cookies.get("access_token") 
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {"access_token": token}