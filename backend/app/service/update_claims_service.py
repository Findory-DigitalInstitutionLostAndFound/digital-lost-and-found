from fastapi import UploadFile, HTTPException
from app.core.supabase_user import get_user_supabase_client
from datetime import datetime, timezone
import uuid

ALLOWED_CAMPUS_SERVICE_POINTS = {
    "Linnanmaa Campus - Oamk Designated Lost & Found Point",
    "Linnanmaa Campus - University of Oulu Designated Lost & Found Point",
    "Kontinkangas Campus - Oamk Designated Lost & Found Point",
    "Kontinkangas Campus - University of Oulu Designated Lost & Found Point",
}

class UpdateClaimsService:
    @staticmethod
    def _get_roles(claim: dict, item: dict, actor: dict) -> tuple[bool, bool]:
        auth_type = actor["auth_type"]
        actor_id = actor["actor_id"]
        if auth_type == "guest":
            is_owner = item.get("guest_id") == actor_id
            is_claimant = claim.get("claimant_guest_id") == actor_id
        else:
            is_owner = item.get("user_id") == actor_id
            is_claimant = claim.get("claimant_user_id") == actor_id
        return is_owner, is_claimant

    @staticmethod
    def _load_claim_with_item(supabase, claim_id: str, item_fields: str = "user_id, guest_id") -> tuple[dict, dict]:
        claim_response = (
            supabase.table("claims")
            .select(f"*, items({item_fields})")
            .eq("id", claim_id)
            .execute()
        )
        if not claim_response.data:
            raise HTTPException(status_code=404, detail="Claim not found.")

        claim = claim_response.data[0]
        item = claim.get("items") or {}
        return claim, item
    
    @staticmethod
    async def update_last_read_time(claim_id: str, actor: dict):
        supabase = actor["supabase"]
        claim, item = UpdateClaimsService._load_claim_with_item(supabase, claim_id, "user_id, guest_id")
        is_owner, is_claimant = UpdateClaimsService._get_roles(claim, item, actor)

        current_time = datetime.now(timezone.utc).isoformat()

        #update the correct last_read_time based on the user role
        if is_claimant:
            supabase.table("claims").update({
                "claimant_last_read_at": current_time
            }).eq("id", claim_id).execute()

        elif is_owner:
            supabase.table("claims").update({
                "owner_last_read_at": current_time
            }).eq("id", claim_id).execute()

        else:
            raise Exception("User is neither the claimant nor the owner of the claim.")

    @staticmethod
    async def update_claim_status(claim_id: str, actor: dict, new_status: str):
        supabase = actor["supabase"]
        claim, item = UpdateClaimsService._load_claim_with_item(supabase, claim_id, "user_id, guest_id")
        is_owner, is_claimant = UpdateClaimsService._get_roles(claim, item, actor)

        if not is_owner and not is_claimant:
            raise Exception("Unauthorized to update the claim status.")
        
        # Update the status
        updated_claim_response = (
            supabase.table("claims")
            .update({
                "status": new_status
            })
            .eq("id", claim_id)
            .execute()
        )

        if not updated_claim_response.data:
            raise Exception(status_code=500, detail="Failed to update claim status.")

        return updated_claim_response.data[0]

    @staticmethod
    async def upload_message_image(file: UploadFile, supabase: dict):
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
        ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
        try:
            if file.content_type not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid file type. Only JPEG, PNG, and WEBP are allowed."
                )

            # Read the file content and check its size
            file_content = await file.read()
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="File is too large. Maximum size is 5 MB."
                )
            
            # Generate a unique filename to avoid collisions
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = unique_filename  
            
            # Upload the file to the "claim_message_images" bucket in Supabase storage
            response = supabase.storage.from_("message_bucket").upload(
                path=file_path, 
                file=file_content,
                file_options={
                    "content_type": file.content_type
                }
            )

            # Get the public URL of the uploaded image
            public_url = supabase.storage.from_("message_bucket").get_public_url(file_path)

            return {
                "message": "Image uploaded successfully.",
                "public_url": public_url
            }
        except HTTPException as he:
            print(f"HTTPException details: {str(he.detail)}")
            raise he
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while uploading the message image.: {str(e)}"
            )

    @staticmethod
    async def send_message(claim_id: str, content: str, image_url: str | None, actor: dict):
        supabase = actor["supabase"]
        auth_type = actor["auth_type"]
        actor_id = actor["actor_id"]

        # Validate that the claim exists and the user is either the owner or the claimant
        claim_response = supabase.table("claims").select("*, items(user_id)").eq("id", claim_id).execute()

        if not claim_response.data:
            raise Exception("Claim not found.")

        claim, item = UpdateClaimsService._load_claim_with_item(supabase, claim_id, "user_id, guest_id")
        is_owner, is_claimant = UpdateClaimsService._get_roles(claim, item, actor)

        if not is_owner and not is_claimant:
            raise Exception("Unauthorized to send a message in this claim.")

        # Insert the message into the "claim_messages" table
        message_data = {
            "claim_id": claim_id,
            "sender_user_id": actor_id if auth_type == "user" else None,
            "sender_guest_id": actor_id if auth_type == "guest" else None,
            "content": content,
            "image_url": image_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        response = supabase.table("claim_messages").insert(message_data).execute()

        if not response.data:
            raise Exception("Failed to send message.")

        await UpdateClaimsService.update_last_read_time(
            claim_id=claim_id,
            actor=actor
        )

        return response.data[0] 

    @staticmethod
    async def update_meetup(
        claim_id: str,
        actor: dict,
        meetup_location: str | None,
        meetup_time: str,
    ):
        supabase = actor["supabase"]
        claim, item = UpdateClaimsService._load_claim_with_item(supabase, claim_id, "user_id, guest_id, is_high_valued")

        is_owner, is_claimant = UpdateClaimsService._get_roles(claim, item, actor)

        if not is_owner and not is_claimant:
            raise HTTPException(status_code=403, detail="Not allowed on this claim.")

        if claim.get("status") != "approved":
            raise HTTPException(
                status_code=400,
                detail="Meetup can only be set after the claim is approved.",
            )

        # First proposal only by found person 
        has_proposal = bool(claim.get("meetup_location") and claim.get("meetup_time"))
        if not has_proposal and not is_owner:
            raise HTTPException(
                status_code=400,
                detail="The found person must suggest the first meetup place and time.",
            )

        # check if meetup location is provided and not empty and time is provided
        if not meetup_location or not meetup_location.strip():
            raise HTTPException(status_code=400, detail="Meetup location is required.")

        location = meetup_location.strip()
        if location not in ALLOWED_CAMPUS_SERVICE_POINTS:
            raise HTTPException(status_code=400, detail="Invalid meetup location.")

        if not meetup_time or not str(meetup_time).strip():
            raise HTTPException(status_code=400, detail="Meetup time is required.")

        # Proposer accepts their own proposal; other side must accept again
        update_data = {
            "meetup_location": location,
            "meetup_time": meetup_time,
            "owner_accepted_meetup": is_owner,
            "claimant_accepted_meetup": is_claimant,
        }

        result = (
            supabase.table("claims")
            .update(update_data)
            .eq("id", claim_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update meetup.")

        return result.data[0]

    # accept meetup proposal
    @staticmethod
    async def accept_meetup(claim_id: str, actor: dict):
        supabase = actor["supabase"]
        claim, item = UpdateClaimsService._load_claim_with_item(supabase, claim_id)

        is_owner, is_claimant = UpdateClaimsService._get_roles(claim, item, actor)

        if not is_owner and not is_claimant:
            raise HTTPException(status_code=403, detail="Not allowed on this claim.")

        if claim.get("status") != "approved":
            raise HTTPException(
                status_code=400,
                detail="Can only accept meetup when claim is approved.",
            )

        if not claim.get("meetup_location") or not claim.get("meetup_time"):
            raise HTTPException(
                status_code=400,
                detail="No meetup proposal to accept yet.",
            )

        update_data = {}
        if is_owner:
            update_data["owner_accepted_meetup"] = True
        if is_claimant:
            update_data["claimant_accepted_meetup"] = True

        result = (
            supabase.table("claims")
            .update(update_data)
            .eq("id", claim_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to accept meetup.")

        return result.data[0]