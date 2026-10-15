from pydantic import BaseModel, EmailStr

class FoundItemRequestSchema(BaseModel):
    title: str
    description: str
    location: str
    date_found: str
    image_url: str