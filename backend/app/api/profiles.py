from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
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
    tags=["Profiles"]
)


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

@router.delete(
    "/{profile_id}"
)
def delete_profile(
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

    db.delete(profile)
    db.commit()

    return {
        "message": "Profile deleted successfully"
    }

# =========================================================
# AI-GENERATED LIVING IDENTITY SUMMARY
# =========================================================

@router.get("/{profile_id}/identity-summary")
def generate_identity_summary(
    profile_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    # Find the profile belonging to this user
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

    # Retrieve memories linked to this specific person
    memories = (
        db.query(Memory)
        .filter(
            Memory.profile_id == profile_id,
            Memory.user_id == user_id,
        )
        .order_by(Memory.created_at.asc())
        .all()
    )

    # Don't invent a summary when there is no information
    if not memories and not profile.description:
        return {
            "profile_id": profile.id,
            "profile_name": profile.name,
            "summary": (
                "Not enough saved information yet. "
                "Add memories to build this person's identity."
            ),
            "memories_used": 0,
        }

    memory_text = "\n\n".join(
        [
            f"Title: {memory.title}\n"
            f"Type: {memory.memory_type}\n"
            f"Memory: {memory.content}"
            for memory in memories
        ]
    )

    prompt = f"""
You are Living Memory AI's Living Identity assistant.

Create a helpful summary of the person using only the
profile details and linked memories provided below.

Person's name: {profile.name}
Relationship: {profile.relationship_type}
Profile description: {profile.description or "Not provided"}

Saved memories:
{memory_text or "No linked memories are available."}

Rules:
- Summarize documented life experiences and interests.
- Describe personality traits only when supported by evidence.
- Never invent events, preferences, relationships, or facts.
- If information is limited, clearly say so.
- Distinguish known facts from tentative observations.
- Do not claim to know the person's thoughts or feelings
  unless the saved information supports that claim.
- Write a warm, natural summary in 1 to 3 paragraphs.
"""

    try:
        from app.services.ai_service import ask_ai

        summary = ask_ai(prompt)

        return {
            "profile_id": profile.id,
            "profile_name": profile.name,
            "summary": summary,
            "memories_used": len(memories),
        }

    except Exception as error:
        print("IDENTITY SUMMARY ERROR:", error)

        raise HTTPException(
            status_code=502,
            detail="Could not generate the identity summary.",
        )
