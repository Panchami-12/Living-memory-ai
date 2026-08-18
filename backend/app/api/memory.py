import uuid
import shutil
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.memory import Memory
from app.schemas.memory import (
    MemoryCreate,
    MemoryResponse,
    ChatRequest,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)


# =========================================================
# BASE / STORAGE DIRECTORIES
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

IMAGE_DIR = BASE_DIR / "storage" / "memory_images"
AUDIO_DIR = BASE_DIR / "storage" / "audio"

IMAGE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

AUDIO_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# GET ALL MEMORIES
# =========================================================

@router.get(
    "/",
    response_model=list[MemoryResponse]
)
def get_memories(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.id.desc())
        .all()
    )

    return memories


# =========================================================
# SEARCH MEMORIES
# =========================================================

@router.get(
    "/search",
    response_model=list[MemoryResponse]
)
def search_memories(
    q: str = Query(..., min_length=1),
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    search_text = q.strip()

    if not search_text:
        return []

    pattern = f"%{search_text}%"

    memories = (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            (
                Memory.title.ilike(pattern)
                | Memory.content.ilike(pattern)
                | Memory.memory_type.ilike(pattern)
            )
        )
        .order_by(Memory.id.desc())
        .all()
    )

    return memories


# =========================================================
# GET SINGLE MEMORY
# =========================================================

@router.get(
    "/{memory_id}",
    response_model=MemoryResponse
)
def get_single_memory(
    memory_id: int,
    db: Session = Depends(get_db)
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    return memory


# =========================================================
# CREATE MEMORY
# =========================================================

@router.post(
    "/",
    response_model=MemoryResponse
)
def create_memory(
    data: MemoryCreate,
    db: Session = Depends(get_db)
):
    new_memory = Memory(
        title=data.title,
        content=data.content,
        memory_type=data.memory_type,
        user_id=data.user_id
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory


# =========================================================
# UPLOAD MEMORY IMAGE
# =========================================================

@router.post("/{memory_id}/image")
async def upload_memory_image(
    memory_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP and GIF images are allowed."
        )

    extension = allowed_types[image.content_type]

    file_path = (
        IMAGE_DIR /
        f"memory_{memory_id}{extension}"
    )

    # Remove previous image
    for old_extension in [
        ".jpg",
        ".png",
        ".webp",
        ".gif",
    ]:
        old_file = (
            IMAGE_DIR /
            f"memory_{memory_id}{old_extension}"
        )

        if old_file.exists():
            try:
                old_file.unlink()
            except Exception:
                pass

    # Save image
    contents = await image.read()

    with open(file_path, "wb") as file:
        file.write(contents)

    # Save image URL
    memory.image_url = (
        f"/memories/{memory_id}/image"
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return {
        "message": "Image uploaded successfully",
        "memory_id": memory.id,
        "image_url": memory.image_url,
    }


# =========================================================
# GET MEMORY IMAGE
# =========================================================

@router.get("/{memory_id}/image")
def get_memory_image(
    memory_id: int,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    extensions = [
        ".jpg",
        ".png",
        ".webp",
        ".gif",
    ]

    for extension in extensions:

        file_path = (
            IMAGE_DIR /
            f"memory_{memory_id}{extension}"
        )

        if file_path.exists():
            return FileResponse(file_path)

    raise HTTPException(
        status_code=404,
        detail="No image found for this memory"
    )


# =========================================================
# UPLOAD MEMORY AUDIO
# =========================================================

@router.post("/{memory_id}/audio")
async def upload_memory_audio(
    memory_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    allowed_types = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/wave": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "audio/ogg": ".ogg",
    }

    content_type = audio.content_type or ""

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only WEBM, WAV, MP3, M4A "
                "and OGG audio files are allowed."
            )
        )

    extension = allowed_types[content_type]

    audio_path = (
        AUDIO_DIR /
        f"memory_{memory_id}{extension}"
    )

    # Remove previous audio
    for old_extension in [
        ".webm",
        ".wav",
        ".mp3",
        ".m4a",
        ".ogg",
    ]:
        old_file = (
            AUDIO_DIR /
            f"memory_{memory_id}{old_extension}"
        )

        if old_file.exists():
            try:
                old_file.unlink()
            except Exception:
                pass

    # Save audio
    contents = await audio.read()

    with open(audio_path, "wb") as file:
        file.write(contents)

    # Save audio URL
    memory.audio_url = (
        f"/memories/{memory_id}/audio"
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return {
        "message": "Audio uploaded successfully",
        "memory_id": memory.id,
        "audio_url": memory.audio_url,
    }


# =========================================================
# GET MEMORY AUDIO
# =========================================================

@router.get("/{memory_id}/audio")
def get_memory_audio(
    memory_id: int,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    extensions = [
        ".webm",
        ".wav",
        ".mp3",
        ".m4a",
        ".ogg",
    ]

    for extension in extensions:

        file_path = (
            AUDIO_DIR /
            f"memory_{memory_id}{extension}"
        )

        if file_path.exists():
            return FileResponse(file_path)

    raise HTTPException(
        status_code=404,
        detail="No audio found for this memory"
    )


# =========================================================
# UPDATE / EDIT MEMORY
# =========================================================

@router.put(
    "/{memory_id}",
    response_model=MemoryResponse
)
def update_memory(
    memory_id: int,
    data: MemoryCreate,
    db: Session = Depends(get_db)
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    memory.title = data.title
    memory.content = data.content
    memory.memory_type = data.memory_type

    db.commit()
    db.refresh(memory)

    return memory


# =========================================================
# DELETE MEMORY
# =========================================================

@router.delete(
    "/{memory_id}"
)
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db)
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    # Delete image
    for extension in [
        ".jpg",
        ".png",
        ".webp",
        ".gif",
    ]:
        image_file = (
            IMAGE_DIR /
            f"memory_{memory_id}{extension}"
        )

        if image_file.exists():
            try:
                image_file.unlink()
            except Exception:
                pass

    # Delete audio
    for extension in [
        ".webm",
        ".wav",
        ".mp3",
        ".m4a",
        ".ogg",
    ]:
        audio_file = (
            AUDIO_DIR /
            f"memory_{memory_id}{extension}"
        )

        if audio_file.exists():
            try:
                audio_file.unlink()
            except Exception:
                pass

    db.delete(memory)
    db.commit()

    return {
        "message": "Memory deleted successfully"
    }


# =========================================================
# CHAT WITH MEMORIES
# =========================================================

@router.post("/chat")
def chat_with_memories(
    data: ChatRequest,
    db: Session = Depends(get_db)
):
    memories = (
        db.query(Memory)
        .filter(
            Memory.user_id == data.user_id
        )
        .order_by(Memory.id.desc())
        .all()
    )

    if not memories:
        return {
            "answer": (
                "I don't have any saved "
                "memories for you yet."
            )
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
You are Living Memory AI.

Answer the user's question using the saved memories below.

Saved memories:
{memory_text}

User question:
{data.question}

Instructions:

- Answer naturally and clearly.
- Use only information available in the saved memories.
- If the answer is not available, say that you don't have that memory.
- Do not invent personal information.
"""

    try:
        from app.services.ai_service import ask_ai

        answer = ask_ai(prompt)

        return {
            "answer": answer
        }

    except Exception as error:

        print("AI ERROR:", error)

        return {
            "answer": (
                "I couldn't connect to the AI service. "
                "Please make sure Ollama is running."
            )
        }