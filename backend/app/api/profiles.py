import re

from app.services.family_pin import hash_family_pin
from app.schemas.profile import ProfilePinSet

from pathlib import Path


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import authorize_request_user
from app.models.profile import Profile
from app.models.memory import Memory
from app.models.user import User
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
)


router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"],
    dependencies=[Depends(authorize_request_user)],
)


# =========================================================
# STORAGE DIRECTORIES
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]
IMAGE_DIR = BASE_DIR / "storage" / "memory_images"
AUDIO_DIR = BASE_DIR / "storage" / "audio"


def remove_memory_files(memory_id: int) -> None:
    """Remove image and audio files belonging to a memory."""

    for extension in (".jpg", ".png", ".webp", ".gif"):
        path = IMAGE_DIR / f"memory_{memory_id}{extension}"

        if path.is_file():
            try:
                path.unlink(missing_ok=True)
            except OSError as error:
                print(f"Could not remove image file {path}: {error}")

    for extension in (".webm", ".wav", ".mp3", ".m4a", ".ogg"):
        path = AUDIO_DIR / f"memory_{memory_id}{extension}"

        if path.is_file():
            try:
                path.unlink(missing_ok=True)
            except OSError as error:
                print(f"Could not remove audio file {path}: {error}")


# =========================================================
# CREATE PROFILE
# =========================================================

@router.post(
    "/",
    response_model=ProfileResponse
)
def create_profile(
    profile_data: ProfileCreate,
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    profile = Profile(
        user_id=user_id,
        name=profile_data.name,
        relationship_type=profile_data.relationship_type,
        description=profile_data.description,
        photo_url=profile_data.photo_url,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


# =========================================================
# GET ALL PROFILES
# =========================================================

@router.get(
    "/",
    response_model=list[ProfileResponse]
)
def get_profiles(
    user_id: int,
    db: Session = Depends(get_db)
):

    profiles = db.query(Profile).filter(
        Profile.user_id == user_id
    ).all()

    return profiles


# =========================================================
# GET SINGLE PROFILE
# =========================================================

@router.get(
    "/{profile_id}",
    response_model=ProfileResponse
)
def get_profile(
    profile_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile


# =========================================================
# UPDATE PROFILE
# =========================================================

@router.put(
    "/{profile_id}",
    response_model=ProfileResponse
)
def update_profile(
    profile_id: int,
    profile_data: ProfileUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    if profile_data.name is not None:
        profile.name = profile_data.name

    if profile_data.relationship_type is not None:
        profile.relationship_type = (
            profile_data.relationship_type
        )

    if profile_data.description is not None:
        profile.description = profile_data.description

    if profile_data.photo_url is not None:
        profile.photo_url = profile_data.photo_url

    db.commit()
    db.refresh(profile)

    return profile


# =========================================================
# DELETE PROFILE
# =========================================================

@router.delete("/{profile_id}")
def delete_profile(
    profile_id: int,
    user_id: int,
    delete_memories: bool = False,
    db: Session = Depends(get_db),
):

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    # Find all memories linked to this profile.
    linked_memories = db.query(Memory).filter(
        Memory.profile_id == profile_id,
        Memory.user_id == user_id
    ).all()

    memory_ids = [
        memory.id for memory in linked_memories
    ]

    if delete_memories:

        # Option 2: Delete profile and linked memories.
        for memory in linked_memories:
            db.delete(memory)

    else:

        # Option 1: Keep memories as general memories.
        for memory in linked_memories:
            memory.profile_id = None

    # Delete the profile.
    db.delete(profile)

    db.commit()

    # Remove attached files only when memories are deleted.
    if delete_memories:
        for memory_id in memory_ids:
            remove_memory_files(memory_id)

    return {
        "message": "Profile deleted successfully",
        "memories_deleted": (
            len(memory_ids) if delete_memories else 0
        ),
        "memories_unassigned": (
            0 if delete_memories else len(memory_ids)
        ),
    }


# =========================================================
# GENERATE AI LIFE STORY
# =========================================================

@router.get("/{profile_id}/life-story")
def generate_life_story(
    profile_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):

    # Find the profile belonging to this user.
    profile = (
        db.query(Profile)
        .filter(
            Profile.id == profile_id,
            Profile.user_id == user_id,
        )
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    # Get memories linked to this person.
    memories = (
        db.query(Memory)
        .filter(
            Memory.profile_id == profile_id,
            Memory.user_id == user_id,
        )
        .order_by(Memory.created_at.asc())
        .all()
    )

    if not memories and not profile.description:
        return {
            "profile_id": profile.id,
            "profile_name": profile.name,
            "story": (
                "There is not enough saved information to "
                "create this person's life story yet."
            ),
            "memories_used": 0,
        }

    memory_text = "\n\n".join(
        [
            f"Title: {memory.title}\n"
            f"Type: {memory.memory_type}\n"
            f"Memory: {memory.content}\n"
            f"Record saved on: "
            f"{memory.created_at or 'Date unavailable'}"
            for memory in memories
        ]
    )

    prompt = f"""
You are Living Memory AI's Life Story writer.

Create a warm, meaningful narrative using only the
profile details and memories provided below.

Name: {profile.name}
Relationship: {profile.relationship_type}
Description: {profile.description or "Not provided"}

Saved memories:
{memory_text or "No linked memories are available."}

Rules:
- Use only facts supported by the supplied information.
- Include important experiences, people, interests, and events
  when they are documented.
- Never invent events, dates, relationships, or emotions.
- A record's saved date is not necessarily the date the
  event happened.
- Use chronological order only when the event dates or
  sequence are supported by the information.
- If information is limited, acknowledge that naturally.
- Write a warm, readable life story in 3 to 6 paragraphs.
"""

    try:
        from app.services.ai_service import ask_ai

        story = ask_ai(prompt)

        return {
            "profile_id": profile.id,
            "profile_name": profile.name,
            "story": story,
            "memories_used": len(memories),
        }

    except Exception as error:
        print("LIFE STORY ERROR:", error)

        raise HTTPException(
            status_code=502,
            detail="Could not generate the life story.",
        )
# =========================================================
# SET OR CHANGE FAMILY PROFILE PIN
# Owner-only endpoint
# =========================================================

@router.put("/{profile_id}/pin")
def set_family_profile_pin(
    profile_id: int,
    data: ProfilePinSet,
    user_id: int,
    db: Session = Depends(get_db),
):
    if not re.fullmatch(r"\d{6}", data.pin):
        raise HTTPException(
            status_code=400,
            detail="PIN must contain exactly six digits.",
        )

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id,
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Family profile not found.",
        )

    profile.pin_hash = hash_family_pin(data.pin)
    profile.pin_failed_attempts = 0
    profile.pin_locked_until = None

    db.commit()

    return {
        "message": "Family PIN saved successfully.",
        "profile_id": profile.id,
        "pin_enabled": True,
    }


# =========================================================
# REMOVE FAMILY PROFILE PIN
# Owner-only endpoint
# =========================================================

@router.delete("/{profile_id}/pin")
def remove_family_profile_pin(
    profile_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id,
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Family profile not found.",
        )

    profile.pin_hash = None
    profile.pin_failed_attempts = 0
    profile.pin_locked_until = None

    db.commit()

    return {
        "message": "Family PIN removed successfully.",
        "profile_id": profile.id,
        "pin_enabled": False,
    }