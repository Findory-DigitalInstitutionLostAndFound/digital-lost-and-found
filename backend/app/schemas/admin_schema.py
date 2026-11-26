from pydantic import BaseModel, Field
from typing import Literal, Optional

# the payload could be 2 or 3 or more admins. so here is the one admin
class AssignAdminSchema(BaseModel):
    user_id: str
    email: str
    service_point: Literal["Linnanmaa service point", "Kontinkangas service point"] 

# here is the list of admins to be assigned
class AssignAdminListSchema(BaseModel):
    admins: list[AssignAdminSchema] = Field(..., min_length=1)

class UpdateAdminSchema(BaseModel):
    user_id: str
    uni_role: Literal["admin", "user"] 
    service_point: Optional[Literal["Linnanmaa service point", "Kontinkangas service point"]] = None

class DropOffQRSchema(BaseModel):
    qr_token: str