from fastapi import HTTPException
from app.core.config import supabase

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

        # Check if user already existed (supabase returns a user object with empty identities if the user already exists)
        if res.user and getattr(res.user, "identities", None) == []:
            raise HTTPException(status_code=400, detail="User already exists.")

        if not res.user:
            raise HTTPException(status_code=400, detail="Failed to register user.")

        return res

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
