from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client
from app.core.supabase_admin import get_admin_supabase_client

STAFF_DOMAINS = ("@oamk.fi", "@oulu.fi", "@gmail.com")  

class AdminService:
    @staticmethod
    async def _verify_super_admin(access_token: str, user_id: str):
        supabase = get_user_supabase_client(access_token)
        caller_profile = (
            supabase
            .table("profiles")
            .select("uni_role")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not caller_profile.data or caller_profile.data.get("uni_role") != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied. Only super admins can perform this action."
            )
    @staticmethod
    async def fetch_all_staff_users(access_token: str, user_id: str):
        try:
            await AdminService._verify_super_admin(access_token, user_id)

            # get staff user details
            admin_supabase = get_admin_supabase_client()
            # Match users with a staff email domain
            domain_filters = ",".join(f"email.ilike.%{domain}" for domain in STAFF_DOMAINS)
            staff_users_response = (
                admin_supabase
                .table("profiles")
                .select("id, email, full_name, uni_role, service_point, account_status")
                .or_(domain_filters)
                .execute()
            )
            staff_users = staff_users_response.data or []
            return staff_users
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching staff users: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while fetching staff users: {str(e)}"
            )

    @staticmethod
    async def assign_admin_role(access_token: str, user_id: str, payload):
        try:
            await AdminService._verify_super_admin(access_token, user_id)

            admin_supabase = get_admin_supabase_client()
            for admin in payload.admins:
                # Update the staff user's role to admin
                update_response = (
                    admin_supabase
                    .table("profiles")
                    .update({"uni_role": "admin", "service_point": admin.service_point})
                    .eq("id", admin.user_id)
                    .execute()
                )
                if not update_response.data:
                    raise HTTPException(
                        status_code=404,
                        detail=f"User not found for id {admin.user_id} ({admin.email})."
                    )
            return "Admin role assigned successfully."
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error assigning admin role: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while assigning admin role: {str(e)}"
            )
        