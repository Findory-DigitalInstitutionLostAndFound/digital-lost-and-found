from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StatusUpdateSchema(BaseModel):
    status: str

class CreateClaimSchema(BaseModel):
    item_id: str

class MeetupUpdateSchema(BaseModel):
    location: str
    time: str