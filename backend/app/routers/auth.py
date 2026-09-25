from fastapi import APIRouter, Response, Request, Depends, HTTPException
from app.schemas.auth_schema import UserRegisterSchema, UserLoginSchema
from app.service.auth_service import AuthService

# create router for auth endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  
        samesite="lax",
        max_age=3600  # 1 hour
    )

@router.post("/register")
# Register a new user
async def register(payload: UserRegisterSchema):
    AuthService.register_user(
        email=payload.email,
        password=payload.password,
        name=payload.name,
        phone=payload.phone
    )

    return {"message": "Please check your email for a confirmation link to complete your registration."}

@router.post("/login")
# Login a user with email and password
async def login(payload: UserLoginSchema, response: Response):
    # Login the user and get the access token
    token = AuthService.login_with_email(payload.email, payload.password)
    # Pass the http response object to set the cookie
    set_auth_cookie(response, token)
    return {"message": "Login successful"}

@router.post("/logout")
# Logout a user by clearing the access token cookie
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

# Get the current authenticated user based on the access token in cookies
async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return AuthService.verify_and_get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

@router.get("/me")
# Get the current authenticated user's information
async def get_me(user: dict = Depends(get_current_user)):
    user_meta = user.get("user_metadata", {})
    return {
        "user_id": user.get("sub"), 
        "email": user.get("email"),
        "full_name": user_meta.get("full_name"),
        "phone": user_meta.get("phone")
    }