from datetime import datetime

from pydantic import BaseModel


# =========================================================
# CREATE MEMORY
# =========================================================

class MemoryCreate(BaseModel):
    title: str
    content: str
    memory_type: str = "personal"
    user_id: int = 1
    profile_id: int | None = None


# =========================================================
# UPDATE MEMORY
# =========================================================

class MemoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    memory_type: str | None = None
    user_id: int | None = None
    profile_id: int | None = None


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

    # Photo attached to the memory
    image_url: str | None = None
    audio_url: str | None = None

    class Config:
        from_attributes = True


# =========================================================
# CHAT REQUEST
# =========================================================

class ChatRequest(BaseModel):
    question: str
    user_id: int = 1
    profile_id: int | None = None