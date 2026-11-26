from pydantic import BaseModel, Field
from typing import Literal

# the payload could be 2 or 3 or more admins. so here is the one admin
class AssignAdminSchema(BaseModel):
    user_id: str
    email: str
    service_point: str

# here is the list of admins to be assigned
class AssignAdminListSchema(BaseModel):
    admins: list[AssignAdminSchema] = Field(..., min_length=1)

class UpdateAdminSchema(BaseModel):
    user_id: str
    uni_role: Literal["admin", "user"] 
    service_point: str | None 

class DropOffQRSchema(BaseModel):
    qr_token: str