from typing import Optional

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    name: str
    relationship_type: str
    description: Optional[str] = None
    photo_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    relationship_type: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    relationship_type: str
    description: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True