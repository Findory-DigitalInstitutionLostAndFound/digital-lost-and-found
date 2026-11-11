from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client

class FetchItemsService:
    @staticmethod
    async def fetch_items(access_token: str):
        try:
            supabase = get_user_supabase_client(access_token)
            items_response = supabase.table("items").select("id, user_id, guest_id, item_type, title, category, public_description, location_name, event_timestamp, blurred_image_url, ai_tags").eq("status", "open").execute()

            items = items_response.data

            return {"items": items or []}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while fetching items.: {str(e)}"
            )