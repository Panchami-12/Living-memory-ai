from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    relationship_type = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    photo_url = Column(
        String(500),
        nullable=True
    )

    # Relationship with User
    user = relationship(
        "User",
        back_populates="profiles"
    )