from fastapi import HTTPException
from app.core.config import supabase
from datetime import datetime, timezone, timedelta

# Allowed university email domains
ALLOWED_DOMAINS = ("@students.oamk.fi", "@oamk.fi", "@student.oulu.fi", "@oulu.fi")

class AuthService:
    @staticmethod
    def register_user(email: str, password: str, name: str, phone: str):

        # validate email domain
        clean_email = email.strip().lower()
        if not clean_email.endswith(ALLOWED_DOMAINS):
            raise HTTPException(
                status_code=400, 
                detail="Invalid email domain. Please use a valid university email address."
            )

        # try to register the user
        try:
            res = supabase.auth.sign_up({
                "email": clean_email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": name,
                        "phone": phone
                    }
                }
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Check if user already existed 
        if not res.user:
                    raise HTTPException(status_code=400, detail="Failed to register user.")
        
        if res.user :
            # User already exists and has confirmed the email
            if res.user.email_confirmed_at is not None:
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please log in instead.")

            # User exists but has not confirmed the email
            if res.user.email_confirmed_at is None:
                # Check if the account was created more than 60 seconds ago
                created_at = res.user.created_at
                
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc) # This assumes the created_at is in UTC if no timezone info is present 
                else:
                    created_at = created_at.astimezone(timezone.utc) # Convert to UTC if timezone info is present

                already_existed = (datetime.now(timezone.utc) - created_at) > timedelta(seconds=60)

                # If the account was created more than 60 seconds ago, resend the confirmation email
                if already_existed:
                        return {"message": "You have created an account before but haven't confirmed your email. Please check your email for a confirmation link. Then update your personal info and password after logging in."}
                    
        return {
            "message": "Please check your email for a confirmation link to complete your registration."
        }

    @staticmethod
    # Login user with email and password
    def login_with_email(email: str, password: str):
        clean_email = email.strip().lower()
        
        try:
            res = supabase.auth.sign_in_with_password({
                "email": clean_email,
                "password": password
            })
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        # Check if the user has confirmed their email
        if res.user.email_confirmed_at is None:
            raise HTTPException(status_code=401, detail="No account found with this email. Please register first.")

        return res.session.access_token

    @staticmethod
    # Verify the JWT token and return the user payload
    def verify_and_get_user(token: str):
        try:
            # Verify the JWT token using Supabase's auth.get_user method
            response = supabase.auth.get_user(
                token
            )

            # Check if the response is valid and contains user information
            if not response or not response.user:
                raise HTTPException(status_code=401, detail="Session expired or invalidd")

            # Extract the user information from the response
            user = response.user

            return {
                "sub": user.id,
                "email": user.email,
                "user_metadata": user.user_metadata or {}
            }
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error verifying token: {e}")
            raise HTTPException(status_code=401, detail="Session expired or invalid")

    @staticmethod
    # Verify the Supabase token and return it if valid
    def verify_supabase_token(token: str):
        try:
            # verify the token using supabase
            response = supabase.auth.get_user(
                token
            )

            # Check if the response is valid and contains user information
            if not response or not response.user:
                raise HTTPException(status_code=401, detail="Session expired or invalid")

            # return the token to be set in the cookie for the frontend
            return token
        
        except Exception as e:
            print(f"Error verifying Supabase token: {e}")
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

    @staticmethod
    def handle_forgot_password(email: str, redirect_to: str):
        # validate email domain
        clean_email = email.strip().lower()
        if not clean_email.endswith(ALLOWED_DOMAINS):
            return # fail silent to avid attacks

        # get a password reset link from supabase
        try:
            res = supabase.auth.reset_password_for_email(
                clean_email,
                options={
                    "redirect_to": redirect_to
                }
            )
            return {"message": "If the email is registered, you will receive a password reset link."}
        except Exception as e:
            print(f"Error resetting password: {e}")

    @staticmethod
    def reset_user_password(new_password: str, access_token: str):
        try:
            print(f"Resetting password for access token: {access_token}")
            # Set the session with the provided access token to authenticate the user
            supabase.auth.set_session(access_token = access_token, refresh_token= access_token)  # Set the session with the provided access token
            
            # Update the user's password using the Supabase client
            res = supabase.auth.update_user({
                "password": new_password
            })
            if not res.user:
                raise HTTPException(status_code=400, detail="Failed to reset password. Invalid or expired access token.")
            return {"message": "Password reset successful."}
            
        except Exception as e:
            print(f"Error resetting password: {e}")
            raise HTTPException(
                status_code=400, 
                detail="Invalid or expired access token. Please request a new password reset link."
            )