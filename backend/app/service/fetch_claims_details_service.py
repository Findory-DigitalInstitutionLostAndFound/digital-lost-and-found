from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client

class FetchClaimsDetailsService:
    @staticmethod
    async def fetch_claims_details_as_claimant(user_id: str, access_token: str) -> list:
        try:
            supabase = get_user_supabase_client(access_token)
            
            # join items table and claim_messages table and het all claims
            claims_response = (supabase.table("claims")
                .select("*, item:items(title, item_type, public_description, blurred_image_url, is_high_valued), messages:claim_messages(*)")
                .eq("claimant_user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            if not claims_response.data:
                return []

            claims = claims_response.data
            for claim in claims:
                # check if unread using claimant_lat_read_at
                claim["is_unread"] = FetchClaimsDetailsService._check_has_unread(
                    claim.get("messages", []), 
                    claim.get("claimant_last_read_at")
                )
            return claims
        
        except Exception as e:
            print(f"Error fetching claims for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while fetching claims: {str(e)}")

    @staticmethod
    async def fetch_claims_details_as_founder(user_id: str, access_token: str) -> list:
        try:
            supabase = get_user_supabase_client(access_token)
            # first get items found by current user
            items_response = (
                supabase.table("items")
                .select("id")
                .eq("user_id", user_id)
                .eq("item_type", "found")
                .execute()
            )
            if not items_response.data:
                return []
            
            found_item_ids = [item["id"] for item in items_response.data]
            
            # then get claims and messages for those items
            claims_response = (
                supabase.table("claims")
                .select("*, item:items(title, item_type, public_description, blurred_image_url, is_high_valued), messages:claim_messages(*)")
                .in_("item_id", found_item_ids)
                .order("created_at", desc=True)
                .execute()
            )
            if not claims_response.data:
                return []

            claims = claims_response.data
            for claim in claims:
                # check if unread using owner_last_read_at
                claim["is_unread"] = FetchClaimsDetailsService._check_has_unread(
                    claim.get("messages", []), 
                    claim.get("owner_last_read_at")
                )
            return claims

        except Exception as e:
            print(f"Error fetching claims for user {user_id}: {str(e)}")
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