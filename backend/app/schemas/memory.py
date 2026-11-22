from datetime import datetime

from pydantic import BaseModel, Field


# =========================================================
# CREATE MEMORY
# =========================================================

class MemoryCreate(BaseModel):
    title: str
    content: str
    memory_type: str = "personal"
    user_id: int = 1
    profile_id: int | None = None
    hidden_from_profile_ids: list[int] = Field(default_factory=list)


# =========================================================
# UPDATE MEMORY
# =========================================================

class MemoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    memory_type: str | None = None
    user_id: int | None = None
    profile_id: int | None = None
    hidden_from_profile_ids: list[int] | None = None


# =========================================================
# MEMORY RESPONSE
# =========================================================

class MemoryResponse(BaseModel):
    id: int
    title: str
    content: str
    memory_type: str
    user_id: int
    profile_id: int | None = None
    created_at: datetime | None = None
    image_url: str | None = None
    audio_url: str | None = None
    hidden_from_profile_ids: list[int] = Field(default_factory=list)

    class Config:
        from_attributes = True


# =========================================================
# CHAT REQUEST
# =========================================================

class ChatRequest(BaseModel):
    question: str
    user_id: int = 1
    # profile_id identifies whose memories the question is about.
    profile_id: int | None = None
    # viewer_profile_id identifies who is asking and whose privacy applies.
    viewer_profile_id: int | None = None
