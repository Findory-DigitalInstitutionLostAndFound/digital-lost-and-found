from pydantic import BaseModel
from typing import Optional

class FoundItemCreateSchema(BaseModel):
    user_id: str
    item_type: str = "found"
    title: str
    description: str
    public_description: str
    category: str
    location_name: str
    event_timestamp: str
    is_high_valued: bool = False
    has_sensitive_data: bool = False
    ai_tags: list[str] = []
    original_image_url: Optional[str] = None
    blurred_image_url: Optional[str] = None
    status: str = "open"  # Default status is "Open"