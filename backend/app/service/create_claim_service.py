from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client

class CreateClaimService:
    @staticmethod
    async def process_claim(item_id: str, access_token: str, user_id: str):
        try:
            supabase = get_user_supabase_client(access_token)

            # Fetch item details from the database
            item_response = supabase.table("items").select("*").eq("id", item_id).execute()
            if item_response.status_code != 200:
                raise HTTPException(status_code=item_response.status_code, detail="Failed to perform claim.")
            
            item = item_response.data[0]

            # Prevent user claiming their own published item
            if item.get("user_id") == user_id:
                raise HTTPException(status_code=400, detail="You cannot claim your own item.")

            # prevent duplicate claims by the same user
            exsisting_claim = supabase.table("claims").select("id").eq("item_id", item_id).eq("claimant_user_id", user_id).eq("status", "pending").execute()
            if exsisting_claim.data:
                raise HTTPException(status_code=400, detail="You have already have an active claim for this item.")

            # Create a new claim entry in the "claims" table
            claim_data = {
                "item_id": item_id,
                "status": "pending",
                "claimant_user_id": user_id,
                "claimant_guest_id": None,
            }
            claim_response = supabase.table("claims").insert(claim_data).execute()
            if not claim_response.data:
                raise HTTPException(status_code=500, detail="Failed to create claim.")
            new_claim = claim_response.data[0]

            return {
                "status": "success",
                "claim_id": new_claim.get("id"),
                "item": item
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while creating the claim: {str(e)}")