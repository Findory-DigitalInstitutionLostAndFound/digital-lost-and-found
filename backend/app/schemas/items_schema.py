from pydantic import BaseModel
from typing import Optional

class ItemCreateSchema(BaseModel):
    user_id: Optional[str] = None  # Make optional for guests
    item_type: str
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
    # For guests 
    guest_id: Optional[str] = None
    guest_match_token: Optional[str] = None
