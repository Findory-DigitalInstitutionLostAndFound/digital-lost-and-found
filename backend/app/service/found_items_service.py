from fastapi import HTTPException
from app.core.config import supabase
from app.schemas.items_schema import FoundItemCreateSchema

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