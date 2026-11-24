from pydantic import BaseModel


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str
class FamilyProfilesRequest(BaseModel):
    owner_email: str


class FamilyPinLoginRequest(BaseModel):
    owner_email: str
    profile_id: int
    pin: str