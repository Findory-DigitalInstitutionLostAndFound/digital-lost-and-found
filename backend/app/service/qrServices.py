from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client

class QrService:
    @staticmethod
    async def update_claim_qr(claim_id: str, user_id: str, qr_token: str, expires_at: str, access_token: str):
        try:
            supabase = get_user_supabase_client(access_token)
            claim_res = (
                supabase.table("claims")
                .select("*, items(user_id)")
                .eq("id", claim_id)
                .execute()
            )

            if not claim_res.data:
                raise HTTPException(status_code=404, detail="Claim not found")
            claim = claim_res.data[0]

            # only the claimant generate the qr
            if claim.get("claimant_user_id") != user_id:
                raise HTTPException(status_code=403, detail="You are not authorized to generate QR for this claim")
            if claim.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Claim is not approved yet")
            if not claim.get("owner_accepted_meetup") or not claim.get("claimant_accepted_meetup"):
                raise HTTPException(status_code=400, detail="Both parties must accept the meetup before generating QR code")
            updated = (
                supabase.table("claims")
                .update(
                    {
                        "qr_token": qr_token,
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