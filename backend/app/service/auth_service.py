from fastapi import HTTPException
from app.core.config import supabase
from app.core.supabase_admin import get_admin_supabase_client
from datetime import datetime, timezone, timedelta

# Allowed university email domains
ALLOWED_DOMAINS = ("@students.oamk.fi", "@oamk.fi", "@student.oulu.fi", "@oulu.fi")
RETENTION_DAYS = 30  # Number of days after which the account will be deleted


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

        #check if the account is staged to deteletion
        admin_supabase = get_admin_supabase_client()
        profile = (
            admin_supabase.table("profiles")
            .select("account_status, deletion_scheduled_at")
            .eq("id", res.user.id)
            .limit(1)
            .execute()
        )

        if profile.data:
            profile_data = profile.data[0]
            if profile_data.get("account_status") == "pending_deletion":
                scheduled_deletion_date = profile_data.get("deletion_scheduled_at").split("T")[0]
                raise HTTPException(
                    status_code=403, 
                    detail=f"This account is deactivated and scheduled for permanent deletion on {scheduled_deletion_date}."
                )
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

    @staticmethod
    def delete_user_account(user_id: str):
        now = datetime.now(timezone.utc)
        cutoff_date = ( now - timedelta(days=RETENTION_DAYS)).isoformat()
        admin_supabase = get_admin_supabase_client()

        # First check if user has any active or pending claims
        active_claims = (admin_supabase.table("claims")
            .select("id, status")
            .eq("claimant_user_id", user_id)
            .in_("status", ["pending", "approved"])
            .execute()
        )

        if active_claims.data:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete account with active or pending claims. Please resolve or cancel your claims first."
            )

        # If no active claims, check for recently completed claims within the retention period
        recent_completed_claims = (admin_supabase.table("claims")
            .select("id, updated_at")
            .eq("claimant_user_id", user_id)
            .eq("status", "handover_completed")
            .gte("updated_at", cutoff_date)
            .order("updated_at", desc=True) 
            .limit(1) 
            .execute()
        )

        # If a recent handover exsists, schedule delayed deletion
        if recent_completed_claims.data:
            latest_handover_str = recent_completed_claims.data[0].get("updated_at")
            latest_handover_date = datetime.fromisoformat(latest_handover_str.replace("Z", "+00:00"))
            deletion_date = latest_handover_date + timedelta(days=RETENTION_DAYS)

            # Update the user's account status to "pending_deletion" and set the deletion date in profile table
            admin_supabase.table("profiles").update({
                "account_status": "pending_deletion",
                "deletion_scheduled_at": deletion_date.isoformat()
            }).eq("id", user_id).execute()

            return {
                "status": "scheduled_deletion",
                "message": "Your account has been deactivated and scheduled for permanent deletion after the 30-day handover dispute window.",
                "deletion_date": deletion_date.isoformat()
            }

        # If no recent handovers, delete the user account immediately
        try:
            admin_supabase.auth.admin.delete_user(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user account: {str(e)}")
        return {
            "status": "deleted",
            "message": "Your account has been permanently deleted.",
            "deletion_date": now.isoformat()
        }