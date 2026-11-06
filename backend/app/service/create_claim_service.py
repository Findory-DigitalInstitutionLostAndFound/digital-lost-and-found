from fastapi import HTTPException, types, BackgroundTasks
from app.core.supabase_user import get_user_supabase_client
import json
import base64
from google.genai import types

class CreateClaimService:
    @staticmethod
    async def process_claim(
        item_id: str, 
        access_token: str, 
        user_id: str, 
        gemini_client, 
        openrouter_client,
        background_tasks: BackgroundTasks
    ) -> dict:
        try:
            supabase = get_user_supabase_client(access_token)

            # Fetch item details from the database
            item_response = supabase.table("items").select("*").eq("id", item_id).execute()
            if not item_response.data:
                raise HTTPException(status_code=404, detail="Item not found.")
            
            item = item_response.data[0]

            # Prevent user claiming their own published item
            #if item.get("user_id") == user_id:
               # raise HTTPException(status_code=400, detail="You cannot claim your own item.")

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
            claim_id = new_claim.get("id")

            # Queue background task for ai question generation
            background_tasks.add_task(
                CreateClaimService._background_generate_verification_questions,
                item=item,
                claim_id=claim_id,
                access_token=access_token,
                gemini_client=gemini_client,
                openrouter_client=openrouter_client
            )

            return {
                "status": "success",
                "claim_id": new_claim.get("id")
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(status_code=500, detail=f"An error occurred while creating the claim: {str(e)}")

    # The background task to generate verification questions asynchronously
    @staticmethod
    async def _background_generate_verification_questions(
        item: dict, 
        claim_id: str, 
        access_token: str, 
        gemini_client, 
        openrouter_client
    ):
        try:
            supabase = get_user_supabase_client(access_token)
            # Generate verification questions using AI
            questions = await CreateClaimService.generate_verification_questions(
                item, 
                access_token, 
                gemini_client, 
                openrouter_client
            )

            # format and save questions to claim_messages table
            formatted_message = "Verification questions generated for ownership check:\n" + "\n".join(
                [f"{i+1}. {q}" for i, q in enumerate(questions)]
            )

            message_data = {
                "claim_id": claim_id,
                "sender_user_id": item.get("user_id"),  
                "sender_guest_id": None,
                "content": formatted_message
            }

            supabase.table("claim_messages").insert(message_data).execute()
        except Exception as e:
            print(f"Background task failed for claim {claim_id}: {str(e)}")

    # Generate verification questions using AI models
    @staticmethod
    async def generate_verification_questions(item: dict, access_token: str, gemini_client, openrouter_client)-> list:
        supabase = get_user_supabase_client(access_token)
        
        # Get item details
        item_title = item.get("title", "")
        item_description = item.get("description", "")
        item_category = item.get("category", "")
        item_location = item.get("location_name", "")
        item_public_description = item.get("public_description", "")
        item_blurred_image_url = item.get("blurred_image_url", "")
        item_original_image_url = item.get("original_image_url", "")

        # helper function to determine the correct MIME type based on file extension
        def get_mime_type(file_path: str) -> str:
            if not file_path:
                return "image/jpeg"
                
            path_lower = file_path.lower()
            if path_lower.endswith(".png"):
                return "image/png"
            elif path_lower.endswith(".webp"):
                return "image/webp"
            else:
                return "image/jpeg" # Default fallback for .jpg, .jpeg


        # Safe helper to extract relative file path and bucket from Supabase public URL
        def download_from_public_url(full_url: str, default_bucket: str):
            if not full_url:
                return None, "image/jpeg"
            try:
                if "/object/public/" in full_url:
                    clean_url = full_url.split("?")[0]
                    path_part = clean_url.split("/object/public/")[-1]
                    segments = path_part.split("/", 1)
                    bucket_name = segments[0]
                    file_path = segments[1]
                    
                    bytes_data = supabase.storage.from_(bucket_name).download(file_path)
                    return bytes_data, get_mime_type(file_path)
            except Exception as ex:
                print(f"Failed URL download for {full_url}: {ex}")
            return None, "image/jpeg"
            
        # if the item has an original image url, take it as bytes to pass to AI to generate questions
        image_bytes = None
        mime_type = "image/jpeg"  
        try:
            if item_original_image_url:
                image_bytes, mime_type = download_from_public_url(item_original_image_url, "original_images")
        
        except Exception as e:
            print(f"Error downloading image: {str(e)}")

        # if the item has a blurred image url, take it as bytes to pass to AI to generate questions
        blurred_image_bytes = None
        blurred_mime_type = "image/jpeg"
        try:
            if item_blurred_image_url:
                blurred_image_bytes, blurred_mime_type = download_from_public_url(item_blurred_image_url, "blurred_images")
        except Exception as e:
            print(f"Error downloading blurred image: {str(e)}")

        prompt = f"""
            You are an expert security and verification auditor for a privacy-focused lost-and-found platform.
            Your goal is to generate EXACTLY 5 high-precision verification questions to determine if a claimant is the rightful owner of this item.

            Item Metadata:
            - Title: {item_title}
            - Category: {item_category}
            - Original Description & Details: {item_description}
            - Public Description & Details: {item_public_description}
            - Location: {item_location}

            IMAGE INSTRUCTIONS
            - Attached Image 1: The public blurred image (what everyone browsing the site sees).
            - Attached Image 2: The original unblurred image (contains hidden sensitive data).

            CRITICAL SECURITY & QUESTION GUIDELINES:
            1. **Compare the images:** Look at what was hidden or blurred out in Image 1 compared to Image 2. Your questions must focus on those specific hidden details (like the name on the bag, internal tags, or serial numbers).
            2. **NEVER leak secrets in your questions:** Do NOT mention any specific engraved names, hidden codes, serial numbers, or exact values.
            3. **For visible physical features (from the image/description):** Ask questions that test if they noticed specific details, but **do not give away the answer**. (Example: Instead of "Is there a scratch on the bottom right?", ask "Are there any specific scuffs, scratches, or wear marks on the item, and where are they located?").
            4. **For hidden secrets (names, codes, contents):** Ask open-ended questions forcing the owner to supply the secret. (Example: "Are there any custom engravings, initials, or serial codes on the item? If so, what do they state?").
            5. Avoid generic yes/no questions. Make them specific enough that a scammer would fail.
            6. Return ONLY a valid JSON array of 5 strings. No markdown formatting blocks or extra commentary outside the array. 
            Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
        """

        # JSON parser helper
        def _parse_json_array(raw: str) -> list[str]:
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:] 
            parsed = json.loads(raw.strip())
            if isinstance(parsed, list) and len(parsed) >= 5:
                return parsed[:5]
            raise ValueError("Response is not a valid list of at least 5 items")

        # try gemini first(it supports image input)
        if gemini_client:
            gemini_models = ["gemini-3.8-flash", "gemini-3.5-flash"]
            for model in gemini_models:
                try:
                    print(f"Trying Gemini model for questions: {model}")
                    contents = [prompt]
                    if image_bytes:
                        contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
                    if blurred_image_bytes:
                        contents.append(types.Part.from_bytes(data=blurred_image_bytes, mime_type=blurred_mime_type))
        
                    response = gemini_client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.3 
                        )
                    )
                    questions = _parse_json_array(response.text)
                    print(f"Successfully generated questions using Gemini ({model})")
                    return questions
                except Exception as e:
                    print(f"Gemini {model} failed → {e}")

        # fallback to OpenRouter if Gemini fails (it supports image input as Base64 data URL)
        if openrouter_client:
            try:
                messages_content = [{"type": "text", "text": prompt}]
                
                # If image exists, convert raw bytes to Base64 data URL for OpenRouter vision models
                if image_bytes:
                    encoded_image = base64.b64encode(image_bytes).decode("utf-8") # Encode to Base64
                    image_data_url = f"data:{mime_type};base64,{encoded_image}" # Create a data URL
                    messages_content.append({ # Add the image as a separate message for OpenRouter
                        "type": "image_url",
                        "image_url": {"url": image_data_url}
                    })

                openrouter_models = [
                    "openrouter/free",
                    "nvidia/nemotron-3.5-super-vl:free",
                    "google/gemma-4-31b-it:free"
                ]
                
                for model in openrouter_models:
                    try:
                        print(f"Trying OpenRouter fallback model: {model}")
                        response = openrouter_client.chat.completions.create(
                            model=model,
                            messages=[{"role": "user", "content": messages_content}],
                            temperature=0.3,
                        )
                        content_text = response.choices[0].message.content
                        questions = _parse_json_array(content_text)
                        print(f"Successfully generated questions using OpenRouter ({model})")
                        return questions
                    except Exception as sub_e:
                        print(f"OpenRouter model {model} failed → {sub_e}")
            except Exception as or_err:
                print(f"OpenRouter execution failed: {or_err}")

        # If all AI providers fail, return a default set of questions
        print("All AI providers failed. Using default fallback questions.")
        return [
            "Can you describe any specific scratches, scuffs, or wear marks on the item?",
            "What exact brand, model, or logo details are present?",
            "What specific contents or items were inside or attached to it?",
            "What color or material is the interior lining or backing?",
            "Can you specify the precise location or circumstances where you last saw it?"
        ]

        

        