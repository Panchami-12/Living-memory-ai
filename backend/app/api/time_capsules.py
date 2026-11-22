from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import authorize_request_user
from app.models.memory import Memory
from app.models.profile import Profile
from app.models.time_capsule import TimeCapsule
from app.models.user import User
from app.schemas.time_capsule import TimeCapsuleCreate

router = APIRouter(
    prefix="/time-capsules",
    tags=["Time Capsules"],
    dependencies=[Depends(authorize_request_user)],
)


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def as_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise HTTPException(
            status_code=400,
            detail="unlock_at must include a timezone.",
        )
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def iso_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    # SQLite returns naive values; these are UTC by this model's convention.
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def locked(capsule: TimeCapsule) -> bool:
    unlock_at = capsule.unlock_at
    if unlock_at.tzinfo is not None:
        unlock_at = unlock_at.astimezone(timezone.utc).replace(tzinfo=None)
    return utc_now_naive() < unlock_at


def capsule_metadata(capsule: TimeCapsule) -> dict:
    # Never put message text or attached-memory details in the list response.
    return {
        "id": capsule.id,
        "title": capsule.title,
        "recipient": capsule.recipient,
        "profile_id": capsule.profile_id,
        "unlock_at": iso_utc(capsule.unlock_at),
        "created_at": iso_utc(capsule.created_at),
        "is_locked": locked(capsule),
        "memory_count": len(capsule.memory_ids or []),
    }


@router.post("/", status_code=201)
def create_time_capsule(
    payload: TimeCapsuleCreate,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    unlock_at = as_utc_naive(payload.unlock_at)
    if unlock_at <= utc_now_naive():
        raise HTTPException(
            status_code=400,
            detail="Choose a date and time in the future.",
        )

    if payload.profile_id is not None:
        profile = (
            db.query(Profile)
            .filter(
                Profile.id == payload.profile_id,
                Profile.user_id == payload.user_id,
            )
            .first()
        )
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="The selected profile does not belong to this user.",
            )

    memory_ids = list(dict.fromkeys(payload.memory_ids))
    if any(memory_id <= 0 for memory_id in memory_ids):
        raise HTTPException(status_code=400, detail="Invalid memory selection.")

    if memory_ids:
        owned_memories = (
            db.query(Memory)
            .filter(
                Memory.user_id == payload.user_id,
                Memory.id.in_(memory_ids),
            )
            .all()
        )
        owned_ids = {memory.id for memory in owned_memories}
        if owned_ids != set(memory_ids):
            raise HTTPException(
                status_code=400,
                detail="One or more selected memories do not belong to this user.",
            )

    title = payload.title.strip()
    message = payload.message.strip()
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required.")

    capsule = TimeCapsule(
        user_id=payload.user_id,
        profile_id=payload.profile_id,
        title=title,
        recipient=(payload.recipient or "").strip() or None,
        message=message,
        unlock_at=unlock_at,
        memory_ids=memory_ids,
    )
    db.add(capsule)
    db.commit()
    db.refresh(capsule)
    return capsule_metadata(capsule)


@router.get("/")
def list_time_capsules(
    user_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    capsules = (
        db.query(TimeCapsule)
        .filter(TimeCapsule.user_id == user_id)
        .order_by(TimeCapsule.unlock_at.asc())
        .all()
    )
    return [capsule_metadata(capsule) for capsule in capsules]


@router.get("/{capsule_id}")
def open_time_capsule(
    capsule_id: int,
    user_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    capsule = (
        db.query(TimeCapsule)
        .filter(
            TimeCapsule.id == capsule_id,
            TimeCapsule.user_id == user_id,
        )
        .first()
    )
    if not capsule:
        raise HTTPException(status_code=404, detail="Time capsule not found.")

    if locked(capsule):
        raise HTTPException(
            status_code=423,
            detail={
                "message": "This time capsule is still sealed.",
                "unlock_at": iso_utc(capsule.unlock_at),
            },
        )

    memories = []
    memory_ids = capsule.memory_ids or []
    if memory_ids:
        memories = (
            db.query(Memory)
            .filter(
                Memory.user_id == user_id,
                Memory.id.in_(memory_ids),
            )
            .all()
        )

    return {
        **capsule_metadata(capsule),
        "is_locked": False,
        "message": capsule.message,
        "memories": [
            {
                "id": memory.id,
                "title": memory.title,
                "content": memory.content,
                "memory_type": memory.memory_type,
                "image_url": memory.image_url,
                "audio_url": memory.audio_url,
                "created_at": iso_utc(memory.created_at),
            }
            for memory in memories
        ],
    }


@router.delete("/{capsule_id}")
def delete_time_capsule(
    capsule_id: int,
    user_id: int = Query(..., gt=0),
    db: Session = Depends(get_db),
):
    capsule = (
        db.query(TimeCapsule)
        .filter(
            TimeCapsule.id == capsule_id,
            TimeCapsule.user_id == user_id,
        )
        .first()
    )
    if not capsule:
        raise HTTPException(status_code=404, detail="Time capsule not found.")

    db.delete(capsule)
    db.commit()
    return {"message": "Time capsule deleted."}
