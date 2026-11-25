from fastapi import HTTPException, UploadFile
from app.core.supabase_user import get_user_supabase_client
from app.schemas.items_schema import ItemCreateSchema
from app.service.gemini_upload_text_analysis import analyze_text_for_sensitive_data
from app.service.sensitive_data_service import is_sensitive_text
from app.service.image_redaction_service import redact_sensitive_areas
from app.core.supabase_admin import get_admin_supabase_client

import uuid


class CreateItemsService:
    @staticmethod
    def generic_public_description(mode: str, category: str) -> str:
        clean_mode = "Found" if mode == "found" else "Lost"
        clean_category = category.strip() if category and category.strip() else "item"
        return f"{clean_mode} {clean_category} reported on campus. Public details pending privacy check."
    
    # function to get the role of the user who is creating the item
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
    # function to save the item to the database
    @staticmethod
    def save_item(item_data: ItemCreateSchema, access_token: str):
        try:
            supabase = get_user_supabase_client(access_token)
            data = item_data.model_dump()  # Convert Pydantic model to dictionary
            # Insert the found item into the "items" table
            response = supabase.table("items").insert(data).execute()

            if not response.data:
                raise HTTPException(status_code=500, detail=f"Failed to store the {item_data.item_type} item.")
            
            return response.data[0]  # Return the created item data
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail= f"An error occurred while saving the {item_data.item_type} item."
            )

    @staticmethod
    async def upload_original_image(file: UploadFile, access_token: str):
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
            
            supabase = get_user_supabase_client(access_token)  
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
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while uploading the original image.: {str(e)}"
            )


    @staticmethod
    async def upload_cleaned_image(file: bytes, access_token: str):
        try:  
            supabase = get_user_supabase_client(access_token)      
            # Generate a unique filename to avoid collisions , always cleaned image will be jpg
            unique_filename = f"{uuid.uuid4()}.jpg"  
            file_path = unique_filename  

            # Upload the file to the "cleaned_images" bucket in Supabase storage
            response = supabase.storage.from_("cleaned_images").upload(
                path=file_path, 
                file=file,
                file_options={
                    "content_type": "image/jpeg"
                }
            )
        
            # Get the public URL of the uploaded image
            public_url = supabase.storage.from_("cleaned_images").get_public_url(file_path)
        
            return {
                "message": "Image uploaded successfully.",
                "public_url": public_url
            }
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while uploading cleaned image.: {str(e)}"
            )

    @staticmethod
    async def process_redaction_in_background(
        item_id: str,
        mode: str,
        description: str,
        category: str,
        image_bytes: bytes | None,
        original_image_url: str | None,
        access_token: str,
        analyzer,
        gemini_client,
        openrouter_client,
        ocr_reader,
    ):
        # Privacy-safe fallbacks: generic text, no image URL if redaction fails
        fallback_text = CreateItemsService.generic_public_description(mode, category)
        public_description = fallback_text
        has_sensitive_data = True
        is_high_value = False
        cleaned_image_url = None

        try:
            text_result = analyze_text_for_sensitive_data(mode, description, gemini_client, openrouter_client)
            candidate_desc = text_result.get("public_description") or text_result.get("cleaned_text")
            if candidate_desc and candidate_desc.strip():
                public_description = candidate_desc.strip()
            has_sensitive_data = bool(text_result.get("has_sensitive_data", False))
            is_high_value = bool(text_result.get("is_high_value", False))
            if is_sensitive_text(public_description, analyzer):
                has_sensitive_data = True
                public_description = fallback_text
        except Exception as e:
            print(f"Background text redaction failed, using generic description: {e}")
            public_description = fallback_text

        if image_bytes and original_image_url:
            try:
                jewellery_categories = {"ring", "rings", "jewellery", "jewelry", "necklace", "bracelet", "watch", "earring"}
                id_categories = {"id", "identity", "passport", "license", "card", "henkilökortti"}
                cat_lower = category.strip().lower()
                force_all = cat_lower in jewellery_categories or cat_lower in id_categories or is_high_value

                cleaned_bytes = redact_sensitive_areas(
                    image_bytes,
                    ocr_reader,
                    analyzer,
                    force_redact_all_text=force_all,
                )
                upload_res = await CreateItemsService.upload_cleaned_image(cleaned_bytes, access_token)
                cleaned_image_url = upload_res.get("public_url")
            except Exception as e:
                print(f"Background image redaction failed, keeping blurred_image_url empty: {e}")
                cleaned_image_url = None

        try:
            admin_supabase = get_admin_supabase_client()
            admin_supabase.table("items").update({
                "public_description": public_description,
                "has_sensitive_data": has_sensitive_data,
                "is_high_valued": is_high_value,
                "blurred_image_url": cleaned_image_url,
            }).eq("id", item_id).execute()
        except Exception as e:
            print(f"Failed to update item {item_id} after background redaction: {e}")

    