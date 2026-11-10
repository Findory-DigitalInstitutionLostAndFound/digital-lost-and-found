from fastapi import UploadFile, HTTPException
from app.core.supabase_user import get_user_supabase_client
from datetime import datetime, timezone
import uuid

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

    @staticmethod
    async def upload_message_image(file: UploadFile, access_token: str):
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

            supabase = get_user_supabase_client(access_token)  
            
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
    async def send_message(claim_id: str, user_id: str, content: str, image_url: str, access_token: str):
        supabase = get_user_supabase_client(access_token)

        # Validate that the claim exists and the user is either the owner or the claimant
        claim_response = supabase.table("claims").select("*, items(user_id)").eq("id", claim_id).execute()

        if not claim_response.data:
            raise Exception("Claim not found.")

        claim = claim_response.data[0]
        item = claim.get("items", {})

        owner_id = item.get("user_id")
        claimant_id = claim.get("claimant_user_id")

        if user_id != owner_id and user_id != claimant_id:
            raise Exception("Unauthorized to send a message in this claim.")

        # Insert the message into the "claim_messages" table
        message_data = {
            "claim_id": claim_id,
            "sender_user_id": user_id,
            "sender_guest_id": None,  
            "content": content,
            "image_url": image_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        response = supabase.table("claim_messages").insert(message_data).execute()

        if not response.data:
            raise Exception("Failed to send message.")

        return response.data[0]  