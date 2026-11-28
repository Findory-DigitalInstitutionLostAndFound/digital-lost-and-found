from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client
from app.core.supabase_admin import get_admin_supabase_client

class FetchClaimsDetailsService:
    @staticmethod
    def get_user_role_info(user_id: str, access_token: str):
        try:
            # Get the user's role from the "profiles" table using the user_id and access_token
            supabase = get_user_supabase_client(access_token)
            res = (
                supabase
                .table("profiles")
                .select("uni_role, service_point")
                .eq("id", user_id)
                .single()
                .execute()
            )
            return res.data or None
        except Exception as e:
            print(f"Error fetching user role: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An internal error occurred: {str(e)}"
            )
    @staticmethod
    async def fetch_claims_details_as_claimant(actor: dict) -> list:
        try:
            supabase = actor["supabase"]
            auth_type = actor["auth_type"]
            actor_id = actor["actor_id"]

            # join items table and claim_messages table and het all claims
            query = (supabase.table("claims")
                .select("*, item:items(title, item_type, public_description, blurred_image_url, is_high_valued), messages:claim_messages(*)")
                .order("created_at", desc=True)
            )
            query = query.eq("claimant_user_id", actor_id) if auth_type == "user" else query.eq("claimant_guest_id", actor_id)
            
            claims_response = query.execute()
            claims = claims_response.data or []
            
            for claim in claims:
                # check if unread using claimant_lat_read_at
                claim["is_unread"] = FetchClaimsDetailsService._check_has_unread(
                    claim.get("messages", []), 
                    claim.get("claimant_last_read_at")
                )
            return claims
        
        except Exception as e:
            print(f"Error fetching claims for user {actor_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching claims: {str(e)}")

    @staticmethod
    async def fetch_claims_details_as_founder(actor: dict, service_point: str) -> list:
        try:
            supabase = get_admin_supabase_client()
            actor_id = actor["actor_id"]


            # first get items related to admin's service point
            items_response = (
                supabase.table("items")
                .select("id")
                .eq("drop_off_location", service_point)
                .eq("item_type", "found")
                .in_("custody_status", [
                    "available_for_pickup",
                    "handed_over"
                ])
                .execute()
            )
                
            filtered_item_ids = [item["id"] for item in (items_response.data or [])]
            if not filtered_item_ids:
                return []
                       
            # then get claims and messages for those items
            claims_response = (
                supabase.table("claims")
                .select("*, item:items(title, item_type, public_description, blurred_image_url, is_high_valued), messages:claim_messages(*)")
                .in_("item_id", filtered_item_ids)
                .order("created_at", desc=True)
                .execute()
            )
            claims = claims_response.data or []
            for claim in claims:
                # check if unread using owner_last_read_at
                claim["is_unread"] = FetchClaimsDetailsService._check_has_unread(
                    claim.get("messages", []), 
                    claim.get("owner_last_read_at")
                )
            return claims

        except Exception as e:
            print(f"Error fetching claims for admin {actor_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching claims: {str(e)}")


    @staticmethod
    def _check_has_unread(messages: list, last_read_at: str) -> bool:
        """Determines if any message in the claim was created after last_read_at"""
        if not messages:
            return False
        if not last_read_at:
            return True
            
        # Find the timestamp of the newest message
        latest_message_time = max(m.get("created_at", "") for m in messages)
        return latest_message_time > last_read_at