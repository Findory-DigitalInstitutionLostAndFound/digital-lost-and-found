from pydantic import BaseModel, EmailStr

class FoundItemRequestSchema(BaseModel):
    title: str
    description: str
    category: str
    location: str
    date_found: str
    tags: list[str]
    image_url: str