from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from app.core.database import Base


class TimeCapsule(Base):
    __tablename__ = "time_capsules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    profile_id = Column(Integer, nullable=True, index=True)

    title = Column(String(160), nullable=False)
    recipient = Column(String(120), nullable=True)
    message = Column(Text, nullable=False)

    # Stored as naive UTC because SQLite does not preserve timezone offsets.
    unlock_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # IDs of memories already belonging to this same user.
    memory_ids = Column(JSON, nullable=False, default=list)
