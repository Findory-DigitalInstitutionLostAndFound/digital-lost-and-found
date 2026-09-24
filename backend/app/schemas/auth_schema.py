from pydantic import BaseModel, EmailStr

# Defines required payload for user registration
class UserRegisterSchema(BaseModel):
    name: str
    phone: str
    email: EmailStr
    password: str

# Define required payload for user login
class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

# Define required payload for google auth exchange
class GoogleAuthSchema(BaseModel):
    access_token: str
