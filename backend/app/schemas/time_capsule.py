from datetime import datetime

from pydantic import BaseModel, Field


class TimeCapsuleCreate(BaseModel):
    user_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=160)
    recipient: str | None = Field(default=None, max_length=120)
    profile_id: int | None = None
    message: str = Field(min_length=1, max_length=10000)
    unlock_at: datetime
    memory_ids: list[int] = Field(default_factory=list)
