from fastapi import HTTPException, UploadFile
from app.core.config import supabase
from app.schemas.items_schema import FoundItemCreateSchema
import uuid

class FoundItemsService:
    @staticmethod
    def save_item(item_data: FoundItemCreateSchema):
        try:
            data = item_data.model_dump()  # Convert Pydantic model to dictionary

            # Insert the found item into the "items" table
            response = supabase.table("items").insert(data).execute()

            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to store the found item.")
            
            return response.data[0]  # Return the created item data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def upload_original_image(file: UploadFile):
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
        ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
        try:
            
            if file.content_type not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid file type. Only JPEG, PNG, and WEBP are allowed.")

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
            # Upload the file to the "original_images" bucket in Supabase storage
            response = supabase.storage.from_("original_images").upload(
                path=file_path, 
                file=file_content,
                file_options={
                    "content_type": file.content_type
                }
            )

            # Get the public URL of the uploaded image
            public_url = supabase.storage.from_("original_images").get_public_url(file_path)

            return {
                "message": "Image uploaded successfully.",
                "public_url": public_url
            }
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while uploading the image. {str(e)}"
            )


    @staticmethod
    async def upload_cleaned_image(file: UploadFile):
        ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
        try:
                    
            if file.content_type not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid file type. Only JPEG, PNG, and WEBP are allowed.")
        
            # Read the file content and check its size
            file_content = await file.read()                    
                     
            # Generate a unique filename to avoid collisions
            file_extension = file.filename.split(".")[-1]
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = unique_filename  
            # Upload the file to the "cleaned_images" bucket in Supabase storage
            response = supabase.storage.from_("cleaned_images").upload(
                path=file_path, 
                file=file_content,
                file_options={
                    "content_type": file.content_type
                }
            )
        
            # Get the public URL of the uploaded image
            public_url = supabase.storage.from_("cleaned_images").get_public_url(file_path)
        
            return {
                "message": "Image uploaded successfully.",
                "public_url": public_url
            }
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while uploading the image. {str(e)}")