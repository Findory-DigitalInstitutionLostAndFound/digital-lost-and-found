from fastapi import HTTPException
from datetime import datetime, timezone
from app.core.supabase_user import get_user_supabase_client

class QrService:
    @staticmethod
    async def update_claim_qr(claim_id: str, actor: dict, qr_token: str, expires_at: str):
        try:
            supabase = actor["supabase"]
            auth_type = actor["auth_type"]
            actor_id = actor["actor_id"]

            claim_res = (
                supabase.table("claims")
                .select("*, items(user_id, guest_id)")
                .eq("id", claim_id)
                .execute()
            )

            if not claim_res.data:
                raise HTTPException(status_code=404, detail="Claim not found")
            claim = claim_res.data[0]

            # only the claimant generate the qr
            is_claimant = (
                claim.get("claimant_guest_id") == actor_id
                if auth_type == "guest"
                else claim.get("claimant_user_id") == actor_id
            )
            if not is_claimant:
                raise HTTPException(status_code=403, detail="You are not authorized to generate QR for this claim")

            if claim.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Claim is not approved yet")
            if not claim.get("owner_accepted_meetup") or not claim.get("claimant_accepted_meetup"):
                raise HTTPException(status_code=400, detail="Both parties must accept the meetup before generating QR code")
            
            updated = (
                supabase.table("claims")
                .update(
                    {
                        "current_qr_token": qr_token,
                        "qr_expires_at": expires_at
                    }
                )
                .eq("id", claim_id)
                .execute()
            )
            if not updated.data:
                raise HTTPException(status_code=500, detail="Failed to update claim with QR code")
            return updated.data[0]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error updating claim QR for claim {claim_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while updating claim QR: {str(e)}")

    @staticmethod
    async def verify_and_complete_handover(
        claim_id: str, 
        actor: dict ,
        scanned_token: str
    ):
        try:
            supabase = actor["supabase"]
            auth_type = actor["auth_type"]
            actor_id = actor["actor_id"]

            # fetch claim with it's items
            claim_res = (
                supabase.table("claims")
                .select("*, items(user_id, guest_id)")
                .eq("id", claim_id)
                .execute()
            )

            if not claim_res.data:
                raise HTTPException(status_code=404, detail="Claim not found")
            claim = claim_res.data[0]


            # only the owner can verify the qr
            item_owner_id = (
                claim.get("items", {}).get("guest_id") == actor_id
                if auth_type == "guest"
                else claim.get("items", {}).get("user_id") == actor_id
            )
            is_owner = item_owner_id
            item_id = claim.get("item_id")
            
            if not is_owner:
                raise HTTPException(status_code=403, detail="Only the founder who posted the item can verify the QR code for this claim")
            if claim.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Claim must be in approved status to verify QR code")

            stored_token = claim.get("current_qr_token")
            expires_at_str = claim.get("qr_expires_at")

            if not stored_token or not expires_at_str:
                raise HTTPException(status_code=400, detail="No active QR code found for this claim")

            #validate the token
            if scanned_token != stored_token:
                raise HTTPException(status_code=400, detail="Invalid QR token")

            # validate expiration time
            expires_at = datetime.fromisoformat(expires_at_str)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(status_code=400, detail="QR token has expired")

            # all checks passed, update the claim status to handover completed
            updated = (
                supabase.table("claims")
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
                (supabase.table("items")
                .update({
                    "status": "resolved",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
                .eq("id", item_id)
                .execute()
                )

            return updated.data[0]

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error verifying QR for claim {claim_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while verifying QR: {str(e)}")
                