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
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse, ChatRequest

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
            "model": "nomic-embed-text-v2-moe",
            "input": (
                ["search_query: " + query_text]
                + [
                    "search_document: " + text
                    for text in memory_texts
                ]
            ),
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
    profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    search_text = q.strip()
    if not search_text:
        return []

    if profile_id is not None:
        validate_profile_for_user(profile_id, user_id, db)

    pattern = f"%{search_text}%"
    memory_query = db.query(Memory).filter(
        Memory.user_id == user_id,
        (
            Memory.title.ilike(pattern)
            | Memory.content.ilike(pattern)
            | Memory.memory_type.ilike(pattern)
        ),
    )

    if profile_id is not None:
        memory_query = memory_query.filter(Memory.profile_id == profile_id)

    return memory_query.order_by(Memory.id.desc()).all()


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
    # If a profile was selected, verify it belongs to this user.
    selected_profile = None
    if data.profile_id is not None:
        selected_profile = (
            db.query(Profile)
            .filter(
                Profile.id == data.profile_id,
                Profile.user_id == data.user_id,
            )
            .first()
        )
        if selected_profile is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found for this user.",
            )

    # Count only memories in the selected scope.
    memory_query = db.query(Memory).filter(
        Memory.user_id == data.user_id
    )
    if data.profile_id is not None:
        memory_query = memory_query.filter(
            Memory.profile_id == data.profile_id
        )

    if memory_query.count() == 0:
        if selected_profile is not None:
            return {
                "answer": (
                    f"I don't have any memories linked to "
                    f"{selected_profile.name}'s profile yet."
                )
            }
        return {"answer": "I don't have any saved memories for you yet."}

    # Retrieve memories by meaning within the selected scope.

    ranked_memories = get_semantic_results(
        question=data.question,
        user_id=data.user_id,
        db=db,
        profile_id=data.profile_id,
        limit=10,
    )

    if not ranked_memories:
        return {
            "answer": (
                "I couldn't find a relevant saved memory "
                "to answer that question."
            )
        }

    question_text = data.question.casefold()
    selected_memories = ranked_memories

    father_question_terms = (
        "father", "dad", "papa", "पापा", "पिता",
        "ಅಪ್ಪ", "ತಂದೆ", "அப்பா", "தந்தை","അച്ഛ", "അപ്പ",
    )
    mother_question_terms = (
        "mother", "mom", "mum", "माँ", "मम्मी",
        "ಅಮ್ಮ", "ತಾಯಿ", "அம்மா", "தாய்", "അമ്മ",
    )

    father_memory_terms = (
        "father", "dad", "papa", "ಪಪ್ಪ", "ಅಪ್ಪ",
        "ತಂದೆ", "அப்பா", "தந்தை", "അച്ഛൻ", "അപ്പൻ",
    )
    mother_memory_terms = (
        "mother", "mom", "mum", "ಅಮ್ಮ", "ತಾಯಿ",
        "அம்மா", "தாய்", "അമ്മ",
    )

    sweet_question_terms = (
        "sweet", "dessert", "मिठाई", "ಸಿಹಿ",
        "ಸಿಹಿತಿಂಡಿ", "இனிப்பு", "மிட்டாய்", "മധുരം",
    )
    food_question_terms = (
        "food", "meal", "dish", "खाना", "भोजन",
        "ಆಹಾರ", "ಊಟ", "உணவு", "சாப்பாடு",
        "ഭക്ഷണം", "ആഹാരം",
    )

    sweet_memory_terms = (
        "sweet", "dessert", "gulab jamun", "मिठाई",
        "ಸಿಹಿ", "ಸಿಹಿತಿಂಡಿ", "இனிப்பு", "மிட்டாய்", "മധുരം",
    )
    food_memory_terms = (
        "food", "meal", "dish", "খाना", "भोजन",
        "ಆಹಾರ", "ಊಟ", "உணவு", "சாப்பாடு", "ഭക്ഷണം", "ആഹാരം",
    )

    def memory_text_lower(memory):
        return (
            f"{memory.get('title') or ''} "
            f"{memory.get('content') or ''} "
            f"{memory.get('memory_type') or ''}"
        ).casefold()

    if any(term in question_text for term in father_question_terms):
        matches = [
            memory for memory in selected_memories
            if any(
                term in memory_text_lower(memory)
                for term in father_memory_terms
            )
        ]
        if matches:
            selected_memories = matches

    elif any(term in question_text for term in mother_question_terms):
        matches = [
            memory for memory in selected_memories
            if any(
                term in memory_text_lower(memory)
                for term in mother_memory_terms
            )
        ]
        if matches:
            selected_memories = matches

    if any(term in question_text for term in sweet_question_terms):
        matches = [
            memory for memory in selected_memories
            if any(
                term in memory_text_lower(memory)
                for term in sweet_memory_terms
            )
        ]
        if matches:
            selected_memories = matches

    elif any(term in question_text for term in food_question_terms):
        matches = [
            memory for memory in selected_memories
            if any(
                term in memory_text_lower(memory)
                for term in food_memory_terms
            )
            and not any(
                term in memory_text_lower(memory)
                for term in sweet_memory_terms
            )
        ]
        if matches:
            selected_memories = matches




    memory_text = "\n\n".join(
        (
            f"Title: {memory['title'] or ''}\n"
            f"Type: {memory['memory_type'] or ''}\n"
            f"Memory: {memory['content'] or ''}\n"
            f"Similarity: {memory['similarity']}"
        )
        for memory in selected_memories
    )


    try:
        request_body = await request.json()
        language = request_body.get("language", "English")
    except Exception:
        language = "English"

    language = str(language or "English").strip()
    language_instructions = {
        "English": "English",
        "Kannada": "Kannada (ಕನ್ನಡ)",
        "Hindi": "Hindi (देवनागरी)",
        "Tamil": "Tamil (தமிழ்)",
        "Malayalam": "Malayalam (മലയാളം)",
    }

    target_language = language_instructions.get(
        language,
        "English"
    )

    profile_context = ""

    if selected_profile is not None:
        profile_context = (
            f"Focus only on memories linked to {selected_profile.name}, "
            f"whose relationship to the user is "
            f"{selected_profile.relationship_type}.\n"
        )

    prompt = f"""
You are Living Memory AI, a multilingual memory assistant.

MANDATORY OUTPUT LANGUAGE: {target_language}

{profile_context}Answer the user's question using the retrieved memories.

Retrieved memories:
{memory_text}

User question:
{data.question}


Rules:
1. Identify the exact fact requested, including the person and attribute.
2. Match the requested attribute exactly. Favourite food, favourite sweet,
   favourite drink, and favourite dessert are different attributes.
3. Use the memory that explicitly answers the question, considering its
   title, type, and content together.
4. Never substitute a related fact about the same person for the requested
   fact. A favourite sweet must not answer a question about favourite food.
5. If the retrieved memories do not contain the exact fact, say that you
   do not know. Never guess.
6. Write the entire answer in {target_language}, using its native script.
7. Translate the meaning of memories when needed; do not copy English
   sentences into a non-English answer.
8. Do not reveal your reasoning or provide an English translation.
9. Keep personal names unchanged.
10. Return only a short, direct answer.
"""

    try:
        from app.services.ai_service import ask_ai

        answer = ask_ai(prompt, language=language)
        return {"answer": answer}
    except Exception as error:
        print("AI ERROR:", error)
        return {
            "answer": (
                "I couldn't connect to the AI service. "
                "Please make sure Ollama is running."
            )
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
    data: MemoryUpdate,
    db: Session = Depends(get_db),
):
    update_data = data.dict(exclude_unset=True)

    if data.user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required")

    memory = (
        db.query(Memory)
        .filter(
            Memory.id == memory_id,
            Memory.user_id == data.user_id,
        )
        .first()
    )

    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    if "profile_id" in update_data:
        profile_id = update_data["profile_id"]

        if profile_id is not None:
            validate_profile_for_user(profile_id, memory.user_id, db)

        memory.profile_id = profile_id

    for field in ("title", "content", "memory_type"):
        if field in update_data:
            setattr(memory, field, update_data[field])

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