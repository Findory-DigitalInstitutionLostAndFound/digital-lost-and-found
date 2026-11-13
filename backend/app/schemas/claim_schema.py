from pydantic import BaseModel

class StatusUpdateSchema(BaseModel):
    status: str

class CreateClaimSchema(BaseModel):
    item_id: str