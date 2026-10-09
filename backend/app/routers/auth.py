from fastapi import APIRouter, Response, Request, Depends, HTTPException
from app.schemas.auth_schema import UserRegisterSchema, UserLoginSchema, SupabaseCallbackSchema, ForgotPasswordSchema, ResetPasswordSchema
from app.service.auth_service import AuthService
from app.api.deps import get_current_user

# create router for auth endpoints
router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True, # Make true so it can not be accessed by JavaScript
        secure=True,  # True in production to ensure cookies are sent over HTTPS
        samesite="lax", #
        max_age=3600,  # 1 hour
        path="/" # Set the cookie for the entire domain
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

@router.post("/supabase-callback")
# Handle Supabase callback after email confirmation
async def supabase_callback(payload: SupabaseCallbackSchema, response: Response):
    #Verify token passed from frontend
    token = AuthService.verify_supabase_token(payload.token)

    # Set the access token in a secure cookie
    set_auth_cookie(response, token)
    
    return {"message": "Email confirmed and logged in successfully."}

@router.post("/forgot-password")
# Handle forgot password request
async def forgot_password(payload: ForgotPasswordSchema):
    # Call auth service to handle forgot password logic
    AuthService.handle_forgot_password(payload.email, payload.redirect_to)
    return {"message": "If the email is registered, you will receive a password reset link."}

@router.post("/reset-password")
# Handle reset password request
async def reset_password(payload: ResetPasswordSchema):
    # Call auth service to handle reset password logic
    AuthService.reset_user_password(payload.new_password, payload.access_token)
    return {"message": "Password has been reset successfully."}