import json
import math
import os
import tempfile
import urllib.request
from pathlib import Path

from faster_whisper import WhisperModel
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.memory import Memory
from app.models.profile import Profile
from app.schemas.memory import MemoryCreate, MemoryResponse, ChatRequest


# =========================================================
# ROUTER AND STORAGE DIRECTORIES
# =========================================================

router = APIRouter(prefix="/memories", tags=["Memories"])

BASE_DIR = Path(__file__).resolve().parents[2]
IMAGE_DIR = BASE_DIR / "storage" / "memory_images"
AUDIO_DIR = BASE_DIR / "storage" / "audio"

IMAGE_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# HELPERS
# =========================================================

def validate_profile_for_user(
    profile_id: int | None,
    user_id: int,
    db: Session,
) -> None:
    """Ensure an optional profile belongs to the same user."""
    if profile_id is None:
        return

    profile = (
        db.query(Profile)
        .filter(
            Profile.id == profile_id,
            Profile.user_id == user_id,
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found for this user",
        )


def cosine_similarity(vector_a: list[float], vector_b: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))
    norm_a = math.sqrt(sum(a * a for a in vector_a))
    norm_b = math.sqrt(sum(b * b for b in vector_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def get_semantic_results(
    question: str,
    user_id: int,
    db: Session,
    profile_id: int | None = None,
    limit: int = 5,
) -> list[dict]:
    """Return saved memories ranked by cosine similarity of Ollama embeddings."""
    query_text = question.strip()
    if not query_text:
        return []

    memory_query = db.query(Memory).filter(Memory.user_id == user_id)
    if profile_id is not None:
        memory_query = memory_query.filter(Memory.profile_id == profile_id)

    memories = memory_query.order_by(Memory.id.desc()).all()
    if not memories:
        return []

    memory_texts = [
        (
            f"Title: {memory.title or ''}. "
            f"Type: {memory.memory_type or ''}. "
            f"Memory: {memory.content or ''}"
        )
        for memory in memories
    ]

    payload = json.dumps(
        {
            "model": "nomic-embed-text",
            "input": [query_text] + memory_texts,
        }
    ).encode("utf-8")

    embedding_request = urllib.request.Request(
        "http://127.0.0.1:11434/api/embed",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(embedding_request, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding service failed: {error}",
        ) from error

    embeddings = result.get("embeddings", [])
    if len(embeddings) != len(memories) + 1:
        raise HTTPException(
            status_code=502,
            detail="Unexpected embedding results from Ollama.",
        )

    query_vector = embeddings[0]
    ranked_memories = []

    for memory, vector in zip(memories, embeddings[1:]):
        score = cosine_similarity(query_vector, vector)
        ranked_memories.append(
            {
                "id": memory.id,
                "title": memory.title,
                "memory_type": memory.memory_type,
                "content": memory.content,
                "user_id": memory.user_id,
                "profile_id": memory.profile_id,
                "similarity": round(score, 4),
            }
        )

    ranked_memories.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )
    return ranked_memories[:limit]


def remove_memory_files(memory_id: int) -> None:
    """Remove local image/audio files attached to one memory."""
    for extension in (".jpg", ".png", ".webp", ".gif"):
        path = IMAGE_DIR / f"memory_{memory_id}{extension}"
        if path.exists():
            try:
                path.unlink()
            except OSError:
                pass

    for extension in (".webm", ".wav", ".mp3", ".m4a", ".ogg"):
        path = AUDIO_DIR / f"memory_{memory_id}{extension}"
        if path.exists():
            try:
                path.unlink()
            except OSError:
                pass


# =========================================================
# GET ALL MEMORIES
# =========================================================

@router.get("/", response_model=list[MemoryResponse])
def get_memories(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.id.desc())
        .all()
    )


# =========================================================
# SEMANTIC SEARCH - SMART MEMORY RECALL
# =========================================================

@router.get("/semantic-search")
def semantic_search(
    q: str = Query(..., min_length=1),
    user_id: int = 1,
    profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_semantic_results(
        question=q,
        user_id=user_id,
        profile_id=profile_id,
        db=db,
        limit=5,
    )


# =========================================================
# KEYWORD SEARCH
# =========================================================

@router.get("/search", response_model=list[MemoryResponse])
def search_memories(
    q: str = Query(..., min_length=1),
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    search_text = q.strip()
    if not search_text:
        return []

    pattern = f"%{search_text}%"
    return (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            (
                Memory.title.ilike(pattern)
                | Memory.content.ilike(pattern)
                | Memory.memory_type.ilike(pattern)
            ),
        )
        .order_by(Memory.id.desc())
        .all()
    )


# =========================================================
# CREATE MEMORY
# =========================================================

@router.post("/", response_model=MemoryResponse)
def create_memory(
    data: MemoryCreate,
    db: Session = Depends(get_db),
):
    validate_profile_for_user(data.profile_id, data.user_id, db)

    new_memory = Memory(
        title=data.title,
        content=data.content,
        memory_type=data.memory_type,
        user_id=data.user_id,
        profile_id=data.profile_id,
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)
    return new_memory


# =========================================================
# CHAT WITH MEMORIES - SEMANTIC MEMORY RECALL
# =========================================================

@router.post("/chat")
async def chat_with_memories(
    data: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    saved_memory_count = (
        db.query(Memory)
        .filter(Memory.user_id == data.user_id)
        .count()
    )

    if saved_memory_count == 0:
        return {"answer": "I don't have any saved memories for you yet."}

    ranked_memories = get_semantic_results(
        question=data.question,
        user_id=data.user_id,
        db=db,
        limit=5,
    )

    if not ranked_memories:
        return {
            "answer": "I couldn't find a relevant saved memory to answer that question."
        }

    memory_text = "\n\n".join(
        (
            f"Title: {memory['title'] or ''}\n"
            f"Type: {memory['memory_type'] or ''}\n"
            f"Memory: {memory['content'] or ''}\n"
            f"Similarity: {memory['similarity']}"
        )
        for memory in ranked_memories
    )

    try:
        request_body = await request.json()
        language = request_body.get("language", "English")
    except Exception:
        language = "English"

    language_instructions = {
        "English": "Respond in English.",
        "Kannada": "Respond in Kannada (ಕನ್ನಡ).",
        "Hindi": "Respond in Hindi (हिन्दी).",
        "Tamil": "Respond in Tamil (தமிழ்).",
        "Malayalam": "Respond in Malayalam (മലയാളം).",
    }
    language_instruction = language_instructions.get(language, "Respond in English.")

    prompt = f"""
You are Living Memory AI.

Answer the user's question using the retrieved memories below.

Retrieved memories:
{memory_text}

User question:
{data.question}

Response language:
{language_instruction}

Instructions:
- Answer naturally and clearly.
- Prioritize memories with higher similarity scores.
- Use only details supported by the retrieved memories.
- If the memories do not contain the answer, say you don't know.
- Do not invent personal facts or events.
- A similarity score is not proof that a fact is true.
- Reply only in the selected response language.
- Keep names and important personal details unchanged.
"""

    try:
        from app.services.ai_service import ask_ai

        answer = ask_ai(prompt)
        return {"answer": answer}
    except Exception as error:
        print("AI ERROR:", error)
        return {
            "answer": "I couldn't connect to the AI service. Please make sure Ollama is running."
        }


# =========================================================
# SPEECH TO TEXT USING WHISPER
# =========================================================

whisper_model = None


@router.post("/transcribe")
async def transcribe_memory_audio(audio: UploadFile = File(...)):
    global whisper_model
    temp_path = None

    try:
        suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Uploaded audio is empty.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        if whisper_model is None:
            whisper_model = WhisperModel(
                "base",
                device="cpu",
                compute_type="int8",
            )

        segments, info = whisper_model.transcribe(temp_path, vad_filter=True)
        transcript = " ".join(segment.text.strip() for segment in segments).strip()

        return {"text": transcript, "language": info.language}

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error}",
        ) from error
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


# =========================================================
# UPLOAD MEMORY IMAGE
# =========================================================

@router.post("/{memory_id}/image")
async def upload_memory_image(
    memory_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    content_type = (image.content_type or "").split(";")[0].strip().lower()
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP and GIF images are allowed.",
        )

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    extension = allowed_types[content_type]
    file_path = IMAGE_DIR / f"memory_{memory_id}{extension}"
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(contents)

    for old_extension in (".jpg", ".png", ".webp", ".gif"):
        old_file = IMAGE_DIR / f"memory_{memory_id}{old_extension}"
        if old_file != file_path and old_file.exists():
            try:
                old_file.unlink()
            except OSError:
                pass

    memory.image_url = f"/memories/{memory_id}/image"
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return {
        "message": "Image uploaded successfully",
        "memory_id": memory.id,
        "image_url": memory.image_url,
    }


@router.get("/{memory_id}/image")
def get_memory_image(
    memory_id: int,
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    for extension in (".jpg", ".png", ".webp", ".gif"):
        file_path = IMAGE_DIR / f"memory_{memory_id}{extension}"
        if file_path.is_file():
            return FileResponse(file_path)

    raise HTTPException(status_code=404, detail="No image found for this memory")


# =========================================================
# UPLOAD MEMORY AUDIO
# =========================================================

@router.post("/{memory_id}/audio")
async def upload_memory_audio(
    memory_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    allowed_types = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/wave": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "audio/ogg": ".ogg",
    }
    content_type = (audio.content_type or "").split(";")[0].strip().lower()
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Use WEBM, WAV, MP3, M4A or OGG.",
        )

    contents = await audio.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded audio is empty.")

    extension = allowed_types[content_type]
    audio_path = AUDIO_DIR / f"memory_{memory_id}{extension}"
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    audio_path.write_bytes(contents)

    for old_extension in (".webm", ".wav", ".mp3", ".m4a", ".ogg"):
        old_file = AUDIO_DIR / f"memory_{memory_id}{old_extension}"
        if old_file != audio_path and old_file.exists():
            try:
                old_file.unlink()
            except OSError:
                pass

    memory.audio_url = f"/memories/{memory_id}/audio"
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return {
        "message": "Audio uploaded successfully",
        "memory_id": memory.id,
        "audio_url": memory.audio_url,
    }


@router.get("/{memory_id}/audio")
def get_memory_audio(
    memory_id: int,
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    for extension in (".webm", ".wav", ".mp3", ".m4a", ".ogg"):
        audio_path = AUDIO_DIR / f"memory_{memory_id}{extension}"
        if audio_path.is_file():
            return FileResponse(audio_path)

    raise HTTPException(status_code=404, detail="No audio found for this memory")


# =========================================================
# GET SINGLE MEMORY
# =========================================================

@router.get("/{memory_id}", response_model=MemoryResponse)
def get_single_memory(
    memory_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id, Memory.user_id == user_id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


# =========================================================
# UPDATE / EDIT MEMORY
# =========================================================

@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    data: MemoryCreate,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id, Memory.user_id == data.user_id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    # If profile_id is supplied, validate it and update the link.
    # If it is omitted/null, keep any existing profile assignment.
    if data.profile_id is not None:
        validate_profile_for_user(data.profile_id, memory.user_id, db)
        memory.profile_id = data.profile_id

    memory.title = data.title
    memory.content = data.content
    memory.memory_type = data.memory_type

    db.commit()
    db.refresh(memory)
    return memory


# =========================================================
# DELETE MEMORY
# =========================================================

@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id, Memory.user_id == user_id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.delete(memory)
    db.commit()
    remove_memory_files(memory_id)
    return {"message": "Memory deleted successfully"}
