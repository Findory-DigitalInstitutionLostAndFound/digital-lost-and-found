from fastapi import HTTPException
from app.core.supabase_user import get_user_supabase_client
from app.core.supabase_admin import get_admin_supabase_client

class FetchItemsService:
    @staticmethod
    async def fetch_items(access_token: str):
        try:
            supabase = get_user_supabase_client(access_token)
            items_response = supabase.table("items").select("id, user_id, guest_id, item_type, title, category, public_description, location_name, event_timestamp, blurred_image_url, ai_tags, drop_off_location, custody_status, qr_token").eq("status", "open").execute()

            items = items_response.data
            # update qr_token with item id
            for item in items:
                if qr_token := item.get("qr_token"):
                    item["qr_token"] = f"findory:handover:{item.get('id')}:{qr_token}"

            return {"items": items or []}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error details: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"An error occurred while fetching items.: {str(e)}"
            )

    @staticmethod
    async def fetch_guest_items(lost_item: dict):
        try:
            supabase = get_admin_supabase_client()

            lost_category = lost_item.get("category")
            lost_tags = lost_item.get("ai_tags") or []

            # build query first
            query = (
                supabase.table("items")
                .select("id, user_id, guest_id, item_type, title, category, public_description, location_name, event_timestamp, blurred_image_url, ai_tags")
                .eq("status", "open")
                .eq("item_type", "found")
            )

            if lost_category and lost_tags:
                tags_csv = ",".join(lost_tags)
                query = query.or_(f"category.eq.{lost_category},ai_tags.ov.{{{tags_csv}}}")
            elif lost_category:
                query = query.eq("category", lost_category)
            elif lost_tags:
                query = query.overlaps("ai_tags", lost_tags)

            found_response = query.order("created_at", desc=True).execute()
            matched_found_items = found_response.data or []

            # Format the guest's own lost item with the same columns
            guest_lost_item = {
                "id": lost_item.get("id"),
                "user_id": lost_item.get("user_id"),
                "guest_id": lost_item.get("guest_id"),
                "item_type": lost_item.get("item_type"),
                "title": lost_item.get("title"),
                "category": lost_item.get("category"),
                "public_description": lost_item.get("public_description"),
                "location_name": lost_item.get("location_name"),
                "event_timestamp": lost_item.get("event_timestamp"),
                "blurred_image_url": lost_item.get("blurred_image_url"),
                "ai_tags": lost_item.get("ai_tags"),
            }

            return {"items": [guest_lost_item, *matched_found_items]}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching guest matched items: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="An error occurred while fetching matched items."
            )