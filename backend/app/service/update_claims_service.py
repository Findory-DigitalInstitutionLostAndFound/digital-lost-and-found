from fastapi import HTTPException, types, BackgroundTasks
from app.core.supabase_user import get_user_supabase_client
from datetime import datetime, timezone

class UpdateClaimsService:
    @staticmethod
    async def update_last_read_time(claim_id: str, user_id: str, access_token: str):
        supabase = get_user_supabase_client(access_token)

        claim_response = supabase.table("claims").select("*, items(user_id)").eq("id", claim_id).execute()

        if not claim_response.data:
            raise Exception("Claim not found.")

        claim = claim_response.data[0]
        item = claim.get("items", {})

        owner_id = item.get("user_id")
        claimant_id = claim.get("claimant_user_id")

        current_time = datetime.now(timezone.utc).isoformat()

        #update the correct last_read_time based on the user role
        if user_id == claimant_id:
            supabase.table("claims").update({
                "claimant_last_read_at": current_time
            }).eq("id", claim_id).execute()

        elif user_id == owner_id:
            supabase.table("claims").update({
                "owner_last_read_at": current_time
            }).eq("id", claim_id).execute()

        else:
            raise Exception("User is neither the claimant nor the owner of the claim.")

    @staticmethod
    async def update_claim_status(claim_id: str, user_id: str, new_status: str, access_token: str):
        supabase = get_user_supabase_client(access_token)

        claim_response = supabase.table("claims").select("*, items(user_id)").eq("id", claim_id).execute()

        if not claim_response.data:
            raise Exception("Claim not found.")

        claim = claim_response.data[0]
        item = claim.get("items", {})

        owner_id = item.get("user_id")
        claimant_id = claim.get("claimant_user_id")

        # Validate that the user is either the owner or the claimant
        if user_id != owner_id and user_id != claimant_id:
            raise Exception("Unauthorized to update the claim status.")

        # Update the status
        updated_claim_response = supabase.table("claims").update({
            "status": new_status
        }).eq("id", claim_id).execute()

        if not updated_claim_response.data:
            raise Exception("Failed to update claim status.")

        return updated_claim_response.data[0]