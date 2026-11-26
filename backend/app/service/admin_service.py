from datetime import datetime, timezone

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
        if not caller_profile.data or caller_profile.data.get("uni_role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied. Only admins can perform this action."
            )

    @staticmethod
    async def verify_admin(user_id: str):
        #confirm if the scanning user is admin
        admim_supabase = get_admin_supabase_client()
        user_profile = (
            admim_supabase
            .table("profiles")
            .select("uni_role")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if user_profile.data.get("uni_role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admins can confirm item dropoffs."
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

    @staticmethod
    async def update_admin_role(access_token: str, user_id: str, payload):
        try:
            await AdminService._verify_super_admin(access_token, user_id)

            # Determine the next service point based on the role
            next_service_point = None if payload.uni_role == "user" else payload.service_point
            admin_supabase = get_admin_supabase_client()
            # Update the staff user's role to admin
            update_response = (
                admin_supabase
                .table("profiles")
                .update({"uni_role": payload.uni_role, "service_point": next_service_point})
                .eq("id", payload.user_id)
                .execute()
            )
            if not update_response.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"User not found for id {payload.user_id}."
                )
            
            return "Admin role updated successfully."
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating admin role: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while updating admin role: {str(e)}"
            )

    @staticmethod
    async def confirm_item_dropoff(access_token: str, user_id: str, qr_token: str):
        try:
            await AdminService.verify_admin(user_id)
            # split the recieved qr_token to get the item id and the original qr token f"findory:handover:{item.get('id')}:{qr_token}"
            _,_, item_id, original_qr_token = qr_token.split(":")

            admin_supabase = get_admin_supabase_client()
            # Update the custody status of the item to "ready for pickup" based on the QR token
            update_response = (
                admin_supabase
                .table("items")
                .update({"custody_status": "available_for_pickup"})
                .eq("id", item_id) 
                .eq("qr_token", original_qr_token)
                .execute()
            )
            if not update_response.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Item not found for QR token {qr_token}."
                )
            # set null the qr token after the item is dropoff confirmed
            clear_qr_response = (
                admin_supabase
                .table("items")
                .update({"qr_token": ""})
                .eq("id", item_id)
                .execute()
            )
            
            return "Item dropoff confirmed and custody status updated successfully."
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error confirming item dropoff: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while confirming item dropoff: {str(e)}"
            )
    @staticmethod
    async def verify_qr_handover(access_token: str, user_id: str, qr_token: str):
        try:
            await AdminService.verify_admin(user_id)
            # split the recieved qr_token to get the item id and the original qr token f"findory:handover:{item.get('id')}:{qr_token}"
            _,_, claim_id, original_qr_token = qr_token.split(":")

            admin_supabase = get_admin_supabase_client()
            # get the claim to verify the qr token and the item id
            claim_response = (
                admin_supabase
                .table("claims")
                .select("item_id, status, current_qr_token, qr_expires_at")
                .eq("id", claim_id)
                .single()
                .execute()
            )
            if not claim_response.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Claim not found for QR token {qr_token}."
                )
            claim_data = claim_response.data
            item_id = claim_data.get("item_id")
            stored_token = claim_data.get("current_qr_token")
            expires_at_str = claim_data.get("qr_expires_at")

            if claim_data.get("status") != "approved":
                raise HTTPException(
                    status_code=400,
                    detail="Claim must be in approved status to verify QR code"
                )
            if stored_token != original_qr_token:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid QR token for this claim"
                )
            # check if the qr token is expired
            expires_at = datetime.fromisoformat(expires_at_str)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=400, detail="QR token has expired")
            
            # all checks passed, update the claim status to handover completed
            updated = (
                admin_supabase.table("claims")
                .update(
                    {
                        "status": "handover_completed",
                        "current_qr_token": None,
                        "qr_expires_at": None
                    }
                )
                .eq("id", claim_id)
                .execute()
            )
            if item_id:
                (admin_supabase.table("items")
                .update({
                    "status": "resolved",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "custody_status": "handed_over"
                })
                .eq("id", item_id)
                .execute()
                )
            
            return "Item handover verified and custody status updated successfully."
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while verifying QR handover: {str(e)}"
            )