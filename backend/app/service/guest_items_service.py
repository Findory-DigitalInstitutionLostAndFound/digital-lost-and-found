from fastapi import HTTPException, UploadFile
from app.schemas.items_schema import ItemCreateSchema
import uuid
import os
from supabase import create_client, Client

# Initialize Supabase admin/service role client for unauthenticated/guest actions
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_admin_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class GuestItemsService:
    @staticmethod
    def save_guest_item(item_data: ItemCreateSchema): 
        try:
            supabase = get_admin_supabase()
            data = item_data.model_dump()  
            response = supabase.table("items").insert(data).execute()
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to store the guest item.")
            return response.data[0]
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while saving the guest report.")

    @staticmethod
    async def upload_guest_original_image(file: UploadFile):
        try:
            supabase = get_admin_supabase()
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"guest_{uuid.uuid4()}.{file_extension}"
            file_content = await file.read()
            
            supabase.storage.from_("original_images").upload(
                path=unique_filename, file=file_content, file_options={"content_type": file.content_type}
            )
            public_url = supabase.storage.from_("original_images").get_public_url(unique_filename)
            return {"public_url": public_url}
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while uploading the guest original image.")

    @staticmethod
    async def upload_guest_cleaned_image(file_bytes: bytes):
        try:
            supabase = get_admin_supabase()
            unique_filename = f"guest_{uuid.uuid4()}.jpg"
            
            supabase.storage.from_("cleaned_images").upload(
                path=unique_filename, file=file_bytes, file_options={"content_type": "image/jpeg"}
            )
            public_url = supabase.storage.from_("cleaned_images").get_public_url(unique_filename)
            return {"public_url": public_url}
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while uploading the guest cleaned image.")