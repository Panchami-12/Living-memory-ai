import json
from logging import info
import math
import os
import re
import tempfile
import urllib.request
import mimetypes

from fastapi.responses import FileResponse, Response

from app.services.storage_service import (
    IMAGE_BUCKET,
    AUDIO_BUCKET,
    storage_enabled,
    memory_object_path,
    upload_private_file,
    download_private_file,
    delete_private_file,
    remove_memory_files as remove_stored_memory_files,
)
from pathlib import Path
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
from dotenv import load_dotenv
from google import genai
from faster_whisper import WhisperModel
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import authorize_request_user
from app.models.memory import Memory
from app.models.profile import Profile
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse, ChatRequest
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if GEMINI_API_KEY
    else None
)
# =========================================================
# ROUTER AND STORAGE DIRECTORIES
# =========================================================

router = APIRouter(
    prefix="/memories",
    tags=["Memories"],
    dependencies=[Depends(authorize_request_user)],
)

# =========================================================
# INDIC TRANS2 TRANSLATION
# =========================================================

TRANSLATION_API_URL = os.getenv(
    "TRANSLATION_API_URL",
    "http://127.0.0.1:8003/translate"
)

OLLAMA_EMBED_URL = os.getenv(
    "OLLAMA_EMBED_URL",
    "http://127.0.0.1:11434/api/embed"
)

def translate_ai_answer(answer: str, language: str) -> str:
    """Translate an English AI answer into the selected Indian language."""
    if language == "English":
        return answer

    payload = json.dumps({
        "text": answer,
        "language": language,
    }).encode("utf-8")

    translation_request = urllib.request.Request(
        TRANSLATION_API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(translation_request, timeout=300) as response:
        result = json.loads(response.read().decode("utf-8"))

    translated_text = result.get("translated_text", "").strip()
    if not translated_text:
        raise ValueError("IndicTrans2 returned an empty translation.")

    return translated_text

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


def validate_hidden_profiles_for_user(
    hidden_profile_ids: list[int] | None,
    user_id: int,
    db: Session,
) -> list[int]:
    """Validate and de-duplicate profile IDs excluded from a memory."""
    profile_ids = list(dict.fromkeys(hidden_profile_ids or []))
    if not profile_ids:
        return []

    existing_ids = {
        row[0]
        for row in (
            db.query(Profile.id)
            .filter(
                Profile.user_id == user_id,
                Profile.id.in_(profile_ids),
            )
            .all()
        )
    }
    invalid_ids = set(profile_ids) - existing_ids
    if invalid_ids:
        raise HTTPException(
            status_code=404,
            detail=(
                "One or more hidden profile IDs do not belong to this user: "
                f"{sorted(invalid_ids)}"
            ),
        )

    return profile_ids


def get_profile_memory_query(
    user_id: int,
    profile_id: int | None,
    db: Session,
):
    """Get a profile's own memories plus shared memories.

    Memories with profile_id=None are shared with profiles unless excluded
    through hidden_from_profile_ids. Memories linked to another profile are
    not included.
    """
    query = db.query(Memory).filter(Memory.user_id == user_id)

    if profile_id is not None:
        validate_profile_for_user(profile_id, user_id, db)
        query = query.filter(
            (Memory.profile_id == profile_id)
            | (Memory.profile_id.is_(None))
        )

    return query


def memory_is_visible_to_profile(
    memory: Memory,
    profile_id: int | None,
) -> bool:
    """Return False when the selected viewing profile is excluded."""
    if profile_id is None:
        # No selected profile means the account owner is viewing memories.
        return True

    hidden_ids = memory.hidden_from_profile_ids or []
    return profile_id not in hidden_ids


def memory_to_response(
    memory: Memory,
    viewer_profile_id: int | None = None,
) -> MemoryResponse:
    """Build a response and attach the viewing profile to media URLs."""
    response = MemoryResponse(
        id=memory.id,
        title=memory.title,
        content=memory.content,
        memory_type=memory.memory_type,
        user_id=memory.user_id,
        profile_id=memory.profile_id,
        created_at=memory.created_at,
        image_url=(
    f"/memories/{memory.id}/image"
    if memory.image_url else None
),
audio_url=(
    f"/memories/{memory.id}/audio"
    if memory.audio_url else None
),
        hidden_from_profile_ids=memory.hidden_from_profile_ids or [],
    )

    if viewer_profile_id is not None:
        if response.image_url:
            response.image_url += f"?viewer_profile_id={viewer_profile_id}"
        if response.audio_url:
            response.audio_url += f"?viewer_profile_id={viewer_profile_id}"
    elif memory.hidden_from_profile_ids:
        # An unscoped account view may list the memory, but cannot fetch
        # protected media without declaring a viewing profile.
        response.image_url = None
        response.audio_url = None

    return response


def enforce_media_visibility(
    memory: Memory,
    viewer_profile_id: int | None,
    db: Session,
) -> None:
    """Protect media requests for profile views.

    A viewer ID is mandatory whenever a memory has profile exclusions, so an
    old unscoped media URL cannot bypass those exclusions.
    """
    hidden_ids = memory.hidden_from_profile_ids or []
    if hidden_ids and viewer_profile_id is None:
        raise HTTPException(
            status_code=403,
            detail="viewer_profile_id is required to access this protected memory media.",
        )

    if viewer_profile_id is None:
        return

    validate_profile_for_user(viewer_profile_id, memory.user_id, db)

    if not memory_is_visible_to_profile(memory, viewer_profile_id):
        raise HTTPException(status_code=404, detail="Memory not found")


# Relationship words in the languages supported by Living Memory AI.
RELATIONSHIP_ALIASES = {
    "father": {
        "father", "dad", "daddy", "papa", "appa", "à²ªà²ªà³à²ª", "à²…à²ªà³à²ª", "à²¤à²‚à²¦à³†",
        "à®…à®ªà¯à®ªà®¾", "à®¤à®¨à¯à®¤à¯ˆ", "à´…à´šàµà´›àµ»", "à´…à´šàµà´›à´¨àµ", "à´ªà´¿à´¤à´¾à´µàµ", "à¤ªà¤¿à¤¤à¤¾", "à¤ªà¤¾à¤ªà¤¾",
    },
    "mother": {
        "mother", "mom", "mum", "mommy", "mummy", "amma", "à²…à²®à³à²®", "à²¤à²¾à²¯à²¿",
        "à®…à®®à¯à®®à®¾", "à®¤à®¾à®¯à¯", "à´…à´®àµà´®", "à¤®à¤¾à¤", "à¤®à¤¾à¤¤à¤¾", "à¤®à¤®à¥à¤®à¥€",
    },
    "grandfather": {
        "grandfather", "grandpa", "granddad", "grandad", "grand father",
        "grand pa", "ajja", "aj-ja", "à²…à²œà³à²œ", "à²¤à²¾à²¤", "à®¤à®¾à®¤à¯à®¤à®¾", "à®¤à®¾à®¤à¯à®¤à®©à¯",
        "à´…à´ªàµà´ªàµ‚à´ªàµà´ªàµ»", "à´…à´ªàµà´ªàµ‚à´ªàµà´ªà´¨àµ", "à´®àµà´¤àµà´¤à´šàµà´›àµ»", "à¤¦à¤¾à¤¦à¤¾", "à¤¨à¤¾à¤¨à¤¾", "à¤¨à¤¾à¤¨à¤¾à¤œà¥€", "à¤¦à¤¾à¤¦à¤¾à¤œà¥€",
    },
    "grandmother": {
        "grandmother", "grandma", "granny", "grand mother", "nani", "dadi",
        "ajji", "à²…à²œà³à²œà²¿", "à²…à²®à³à²®à²®à³à²®", "à®ªà®¾à®Ÿà¯à®Ÿà®¿", "à®ªà®¾à®Ÿà¯à®Ÿà®¿à®®à®¾", "à´®àµà´¤àµà´¤à´¶àµà´¶à´¿", "à´…à´®àµà´®àµ‚à´®àµà´®",
        "à¤¦à¤¾à¤¦à¥€", "à¤¨à¤¾à¤¨à¥€", "à¤¨à¤¾à¤¨à¥€à¤œà¥€", "à¤¦à¤¾à¤¦à¥€à¤œà¥€",
    },
    "brother": {"brother", "bro", "à²…à²£à³à²£", "à²¤à²®à³à²®", "à®…à®£à¯à®£à®©à¯", "à®¤à®®à¯à®ªà®¿", "à´¸à´¹àµ‹à´¦à´°àµ»", "à¤­à¤¾à¤ˆ"},
    "sister": {"sister", "sis", "à²…à²•à³à²•", "à²¤à²‚à²—à²¿", "à®…à®•à¯à®•à®¾", "à®¤à®™à¯à®•à¯ˆ", "à´¸à´¹àµ‹à´¦à´°à´¿", "à¤¬à¤¹à¤¨"},
}


def _contains_phrase(text_value: str, phrase: str) -> bool:
    """Match a relationship/name without matching inside unrelated ASCII words."""
    value = (text_value or "").casefold()
    term = (phrase or "").strip().casefold()
    if not term:
        return False
    if term.isascii() and re.fullmatch(r"[a-z0-9 ]+", term):
        pattern = r"(?<![a-z0-9])" + re.escape(term).replace(r"\ ", r"\s+") + r"(?![a-z0-9])"
        return re.search(pattern, value) is not None
    return term in value


def _canonical_relationship(value: str | None) -> str | None:
    normalized = (value or "").strip().casefold()
    if not normalized:
        return None
    for canonical, aliases in RELATIONSHIP_ALIASES.items():
        if normalized in aliases:
            return canonical
    return normalized


def find_profile_mentioned_in_question(
    question: str,
    profiles: list[Profile],
) -> Profile | None:
    """Resolve a named family member from the question, when unambiguous.

    Profile names take precedence over relationship aliases. For a relationship
    word such as "Grandpa", only auto-select when one profile has that relation.
    """
    question_text = (question or "").casefold()

    name_matches = [
        profile
        for profile in profiles
        if profile.name and _contains_phrase(question_text, profile.name)
    ]
    if len(name_matches) == 1:
        return name_matches[0]
    if len(name_matches) > 1:
        # Prefer the longest explicit name (e.g. "Grandpa Raj" over "Grandpa").
        name_matches.sort(key=lambda item: len(item.name or ""), reverse=True)
        if len(name_matches) == 1 or len(name_matches[0].name or "") > len(name_matches[1].name or ""):
            return name_matches[0]
        return None

    requested_relationships = {
        canonical
        for canonical, aliases in RELATIONSHIP_ALIASES.items()
        if any(_contains_phrase(question_text, alias) for alias in aliases)
    }

    # A question may mention more than one family role; do not guess which one.
    if len(requested_relationships) != 1:
        return None

    relationship = next(iter(requested_relationships))
    relation_matches = [
        profile
        for profile in profiles
        if _canonical_relationship(profile.relationship_type) == relationship
    ]
    return relation_matches[0] if len(relation_matches) == 1 else None


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
    viewer_profile_id: int | None = None,
    limit: int = 5,
) -> list[dict]:
    """Return saved memories ranked by cosine similarity of Ollama embeddings."""
    query_text = question.strip()
    if not query_text:
        return []

    memory_query = get_profile_memory_query(user_id, profile_id, db)
    if viewer_profile_id is not None:
        validate_profile_for_user(viewer_profile_id, user_id, db)

    memories = [
        memory
        for memory in memory_query.order_by(Memory.id.desc()).all()
        if memory_is_visible_to_profile(memory, viewer_profile_id)
    ]
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
        OLLAMA_EMBED_URL,
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


def remove_memory_files(
    memory_id: int,
    image_ref: str | None = None,
    audio_ref: str | None = None,
) -> None:
    remove_stored_memory_files(
        memory_id,
        image_ref=image_ref,
        audio_ref=audio_ref,
    )
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
    profile_id: int | None = None,
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    memory_query = get_profile_memory_query(user_id, profile_id, db)
    if viewer_profile_id is not None:
        validate_profile_for_user(viewer_profile_id, user_id, db)

    memories = memory_query.order_by(Memory.id.desc()).all()
    visible_memories = [
        memory
        for memory in memories
        if memory_is_visible_to_profile(memory, viewer_profile_id)
    ]

    return [
        memory_to_response(memory, viewer_profile_id)
        for memory in visible_memories
    ]



# =========================================================
# SEMANTIC SEARCH - SMART MEMORY RECALL
# =========================================================

@router.get("/semantic-search")
def semantic_search(
    q: str = Query(..., min_length=1),
    user_id: int = 1,
    profile_id: int | None = None,
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_semantic_results(
        question=q,
        user_id=user_id,
        profile_id=profile_id,
        viewer_profile_id=viewer_profile_id,
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
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    search_text = q.strip()
    if not search_text:
        return []

    if viewer_profile_id is not None:
        validate_profile_for_user(viewer_profile_id, user_id, db)

    pattern = f"%{search_text}%"
    memory_query = get_profile_memory_query(user_id, profile_id, db).filter(
        (
            Memory.title.ilike(pattern)
            | Memory.content.ilike(pattern)
            | Memory.memory_type.ilike(pattern)
        )
    )

    memories = memory_query.order_by(Memory.id.desc()).all()
    visible_memories = [
        memory
        for memory in memories
        if memory_is_visible_to_profile(memory, viewer_profile_id)
    ]

    return [
        memory_to_response(memory, viewer_profile_id)
        for memory in visible_memories
    ]


# =========================================================
# CREATE MEMORY
# =========================================================

@router.post("/", response_model=MemoryResponse)
def create_memory(
    data: MemoryCreate,
    db: Session = Depends(get_db),
):
    validate_profile_for_user(data.profile_id, data.user_id, db)
    hidden_profile_ids = validate_hidden_profiles_for_user(
        data.hidden_from_profile_ids,
        data.user_id,
        db,
    )

    new_memory = Memory(
        title=data.title,
        content=data.content,
        memory_type=data.memory_type,
        user_id=data.user_id,
        profile_id=data.profile_id,
        hidden_from_profile_ids=hidden_profile_ids,
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
    # A profile selected in the Chat UI takes precedence. Otherwise, infer
    # the family member when the question explicitly names one (Dad, Mom,
    # Grandma, Grandpa, a profile name, etc.). This prevents unrelated
    # memories from being sent to the AI for a person-specific question.
    selected_profile = None
    all_profiles = (
        db.query(Profile)
        .filter(Profile.user_id == data.user_id)
        .all()
    )

    if data.profile_id is not None:
        selected_profile = next(
            (profile for profile in all_profiles if profile.id == data.profile_id),
            None,
        )
        if selected_profile is None:
            raise HTTPException(
                status_code=404,
                detail="Profile not found for this user.",
            )
    else:
        selected_profile = find_profile_mentioned_in_question(
            data.question,
            all_profiles,
        )

    # When the user names a family member, search that person's memories
    # plus shared memories. The viewer profile remains a separate permission.
    scope_profile_id = (
        selected_profile.id if selected_profile is not None else data.profile_id
    )

    selected_viewer_profile = None
    if data.viewer_profile_id is not None:
        selected_viewer_profile = (
            db.query(Profile)
            .filter(
                Profile.id == data.viewer_profile_id,
                Profile.user_id == data.user_id,
            )
            .first()
        )
        if selected_viewer_profile is None:
            raise HTTPException(
                status_code=404,
                detail="Viewing profile not found for this user.",
            )

    # profile_id selects whose memories are in scope; viewer_profile_id
    # controls which memories the person asking is allowed to see.
    memory_query = get_profile_memory_query(
        data.user_id,
        scope_profile_id,
        db,
    )
    visible_memories = [
        memory
        for memory in memory_query.all()
        if memory_is_visible_to_profile(memory, data.viewer_profile_id)
    ]

    if not visible_memories:
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
        profile_id=scope_profile_id,
        viewer_profile_id=data.viewer_profile_id,
        # Give person-specific memories room to rank above shared memories.
        limit=30 if selected_profile is not None else 10,
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

    # If the question identifies a person and that person has linked memories,
    # prioritize those over shared memories. This fixes cross-person answers
    # such as Grandpa's advice being answered with Mom's breakfast memory.
    if selected_profile is not None:
        person_memories = [
            memory for memory in selected_memories
            if memory.get("profile_id") == selected_profile.id
        ]
        if person_memories:
            selected_memories = person_memories

    father_question_terms = (
        "father", "dad", "papa", "à¤ªà¤¾à¤ªà¤¾", "à¤ªà¤¿à¤¤à¤¾",
        "à²…à²ªà³à²ª", "à²¤à²‚à²¦à³†", "à®…à®ªà¯à®ªà®¾", "à®¤à®¨à¯à®¤à¯ˆ","à´…à´šàµà´›", "à´…à´ªàµà´ª",
    )
    mother_question_terms = (
        "mother", "mom", "mum", "à¤®à¤¾à¤", "à¤®à¤®à¥à¤®à¥€",
        "à²…à²®à³à²®", "à²¤à²¾à²¯à²¿", "à®…à®®à¯à®®à®¾", "à®¤à®¾à®¯à¯", "à´…à´®àµà´®",
    )

    father_memory_terms = (
        "father", "dad", "papa", "à²ªà²ªà³à²ª", "à²…à²ªà³à²ª",
        "à²¤à²‚à²¦à³†", "à®…à®ªà¯à®ªà®¾", "à®¤à®¨à¯à®¤à¯ˆ", "à´…à´šàµà´›àµ»", "à´…à´ªàµà´ªàµ»",
    )
    mother_memory_terms = (
        "mother", "mom", "mum", "à²…à²®à³à²®", "à²¤à²¾à²¯à²¿",
        "à®…à®®à¯à®®à®¾", "à®¤à®¾à®¯à¯", "à´…à´®àµà´®",
    )

    sweet_question_terms = (
        "sweet", "dessert", "à¤®à¤¿à¤ à¤¾à¤ˆ", "à²¸à²¿à²¹à²¿",
        "à²¸à²¿à²¹à²¿à²¤à²¿à²‚à²¡à²¿", "à®‡à®©à®¿à®ªà¯à®ªà¯", "à®®à®¿à®Ÿà¯à®Ÿà®¾à®¯à¯", "à´®à´§àµà´°à´‚",
    )
    food_question_terms = (
        "food", "meal", "dish", "à¤–à¤¾à¤¨à¤¾", "à¤­à¥‹à¤œà¤¨",
        "à²†à²¹à²¾à²°", "à²Šà²Ÿ", "à®‰à®£à®µà¯", "à®šà®¾à®ªà¯à®ªà®¾à®Ÿà¯",
        "à´­à´•àµà´·à´£à´‚", "à´†à´¹à´¾à´°à´‚",
    )

    sweet_memory_terms = (
        "sweet", "dessert", "gulab jamun", "à¤®à¤¿à¤ à¤¾à¤ˆ",
        "à²¸à²¿à²¹à²¿", "à²¸à²¿à²¹à²¿à²¤à²¿à²‚à²¡à²¿", "à®‡à®©à®¿à®ªà¯à®ªà¯", "à®®à®¿à®Ÿà¯à®Ÿà®¾à®¯à¯", "à´®à´§àµà´°à´‚",
    )
    food_memory_terms = (
        "food", "meal", "dish", "à¤–à¤¾à¤¨à¤¾", "à¤­à¥‹à¤œà¤¨",
        "à²†à²¹à²¾à²°", "à²Šà²Ÿ", "à®‰à®£à®µà¯", "à®šà®¾à®ªà¯à®ªà®¾à®Ÿà¯", "à´­à´•àµà´·à´£à´‚", "à´†à´¹à´¾à´°à´‚",
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

    advice_question_terms = (
        "advice", "wisdom", "lesson", "lessons", "teachings", "teaching",
        "what did he teach", "what does he advise", " à²¸à²²à²¹à³†", "à²¸à²²à²¹à³†", "à²‰à²ªà²¦à³‡à²¶",
        "à²®à²¾à²°à³à²—à²¦à²°à³à²¶à²¨", "à²¬à³à²¦à³à²§à²¿à²µà²¾à²¦", "à²…à²¨à³à²­à²µà²¦ à²®à²¾à²¤à³", "à²…à²°à²¿à²µà³",
        "à®…à®±à®¿à®µà¯à®°à¯ˆ", "à®†à®²à¯‹à®šà®©à¯ˆ", "à®‰à®ªà®¤à¯‡à®šà®®à¯", "à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà¯à®¤à®²à¯",
        "à´‰à´ªà´¦àµ‡à´¶à´‚", "à´‰à´ªà´¦àµ‡à´¶à´™àµà´™àµ¾", "à´¨à´²àµà´² à´‰à´ªà´¦àµ‡à´¶à´‚", "à¤¸à¤²à¤¾à¤¹", "à¤¸à¥€à¤–", "à¤¶à¤¿à¤•à¥à¤·à¤¾", "à¤‰à¤ªà¤¦à¥‡à¤¶",
    )
    advice_memory_terms = (
        "advice", "wisdom", "lesson", "teach", "remind", "patience",
        "honesty", "kindness", "guidance", "à¤¸à¤²à¤¾à¤¹", "à¤¸à¥€à¤–", "à¤¶à¤¿à¤•à¥à¤·à¤¾",
        "à²‰à²ªà²¦à³‡à²¶", "à²¸à²²à²¹à³†", "à²®à²¾à²°à³à²—à²¦à²°à³à²¶à²¨", "à®žà®¾à®©à®®à¯", "à®…à®±à®¿à®µà¯à®°à¯ˆ", "à´‰à´ªà´¦àµ‡à´¶à´‚",
    )
    if any(term.strip() in question_text for term in advice_question_terms if term.strip()):
        advice_matches = [
            memory for memory in selected_memories
            if any(term in memory_text_lower(memory) for term in advice_memory_terms)
        ]
        if advice_matches:
            selected_memories = advice_matches

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
    # The LLM generates a reliable English answer first.
    # IndicTrans2 translates that answer into the selected language below.
    supported_languages = {"English", "Kannada", "Hindi", "Tamil", "Malayalam"}
    if language not in supported_languages:
        language = "English"
    target_language = "English"

    profile_context = ""

    if selected_profile is not None:
        profile_context = (
            f"The user is specifically asking about {selected_profile.name} "
            f"({selected_profile.relationship_type}). Prioritize memories linked "
            f"to this profile. Shared memories may be used only when they clearly "
            f"answer the question. Do not use another person's personal memory "
            f"as a substitute.\n"
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
6. Write the entire answer in English. IndicTrans2 will translate it afterward.
7. Use clear, simple English and preserve the exact meaning of each memory.
8. Do not reveal your reasoning. Return only the answer, without explanations.
9. Keep personal names unchanged.
10. Return only a short, direct answer.
11. When the question names a family member, answer only from memories
    relevant to that named person. Never reuse a fact from a different person.
12. If the retrieved memories do not directly support the requested fact,
    clearly say that the information is not saved.
"""

    # =========================================================
    # GENERATE THE ANSWER IN ENGLISH
    # =========================================================
    try:
        from app.services.ai_service import ask_ai

        english_answer = ask_ai(prompt, language="English")
    except Exception as error:
        print("AI GENERATION ERROR:", error)
        return {
            "answer": (
                "I couldn't generate an answer. "
                "Please check that Ollama is running."
            )
        }

    # =========================================================
    # TRANSLATE WITH INDIC TRANS2
    # =========================================================
    try:
        answer = translate_ai_answer(english_answer, language)
        return {"answer": answer}
    except Exception as error:
        print("INDICTRANS TRANSLATION ERROR:", error)
        raise HTTPException(
            status_code=502,
            detail=(
                "Translation failed. Please check that IndicTrans2 "
                "is running on port 8003."
            ),
        ) from error


# =========================================================
# SPEECH TO TEXT USING WHISPER
# =========================================================

whisper_model = None







@router.post("/transcribe")
async def transcribe_memory_audio(
    audio: UploadFile = File(...),
    language: str = Form(default=""),
):
    global whisper_model

    temp_path = None
    gemini_file = None

    try:
        # Read uploaded audio
        suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
        audio_bytes = await audio.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio is empty."
            )

        # Save audio temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        requested_language = language.strip().lower()

        # ==========================================
        # GEMINI KANNADA TRANSCRIPTION
        # ==========================================

        if (
            requested_language in {"kn", "kn-in", "kannada"}
            and gemini_client is not None
        ):
            try:
                print("[TRANSCRIBE] Using Gemini Kannada transcription")

                # Upload audio to Gemini
                gemini_file = gemini_client.files.upload(
                    file=temp_path
                )

                # Generate Kannada transcript
                response = gemini_client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=[
                        """
                        Listen carefully to the attached audio.

                        The speaker is speaking Kannada.

                        Transcribe exactly the words spoken.
                        Write the result ONLY in Kannada script.

                        Do not translate.
                        Do not summarize.
                        Do not add missing words.
                        Do not repeat words that were spoken only once.

                        Return only the transcript.
                        """,
                        gemini_file,
                    ],
                )

                transcript = (response.text or "").strip()

                if transcript:
                    print(
                        f"[TRANSCRIBE] Gemini result: {transcript!r}"
                    )

                    return {
                        "text": transcript,
                        "language": "kn",
                        "provider": "gemini",
                    }

                print(
                    "[TRANSCRIBE] Gemini returned empty text. "
                    "Using Whisper fallback."
                )

            except Exception as gemini_error:
                print(
                    f"[TRANSCRIBE] Gemini error: {gemini_error}"
                )

                print(
                    "[TRANSCRIBE] Switching to Whisper fallback."
                )

            finally:
                # Delete uploaded Gemini audio
                if gemini_file and gemini_file.name:
                    try:
                        gemini_client.files.delete(
                            name=gemini_file.name
                        )
                    except Exception as delete_error:
                        print(
                            f"[TRANSCRIBE] Cleanup warning: {delete_error}"
                        )

        # ==========================================
        # WHISPER FALLBACK
        # ==========================================

        if whisper_model is None:
            whisper_model = WhisperModel(
                "small",
                device="cpu",
                compute_type="int8",
            )

        segments, info = whisper_model.transcribe(
            temp_path,
            language=requested_language or None,
            task="transcribe",
            vad_filter=True,
        )

        transcript = " ".join(
            segment.text.strip()
            for segment in segments
        ).strip()

        # Convert Devanagari script into Kannada script
        if any(
            "\u0900" <= char <= "\u097F"
            for char in transcript
        ):
            transcript = transliterate(
                transcript,
                sanscript.DEVANAGARI,
                sanscript.KANNADA,
            )

        print(
            f"[TRANSCRIBE] Whisper result: {transcript!r}"
        )

        return {
            "text": transcript,
            "language": info.language,
            "provider": "whisper",
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {error}",
        ) from error

    finally:
        # Remove temporary local audio
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
    memory = db.query(Memory).filter(
        Memory.id == memory_id
    ).first()

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found",
        )

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }

    content_type = (
        (image.content_type or "")
        .split(";")[0]
        .strip()
        .lower()
    )

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP and GIF images are allowed.",
        )

    contents = await image.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    extension = allowed_types[content_type]
    old_reference = memory.image_url

    if storage_enabled():
        object_path = memory_object_path(
            memory.user_id,
            memory.id,
            "image",
            extension,
        )

        upload_private_file(
            IMAGE_BUCKET,
            object_path,
            contents,
            content_type,
        )

        new_reference = f"supabase://{object_path}"

    else:
        file_path = IMAGE_DIR / f"memory_{memory_id}{extension}"
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(contents)

        new_reference = f"/memories/{memory_id}/image"

    memory.image_url = new_reference

    try:
        db.commit()
    except Exception:
        db.rollback()
        if (
            new_reference.startswith("supabase://")
            and new_reference != old_reference
        ):
            try:
                delete_private_file(
                    IMAGE_BUCKET,
                    new_reference.removeprefix("supabase://"),
                )
            except Exception:
                pass
        raise

    # Remove obsolete local image formats.
    for old_extension in (".jpg", ".png", ".webp", ".gif"):
        old_file = IMAGE_DIR / f"memory_{memory_id}{old_extension}"

        if not storage_enabled() or old_file.suffix != extension:
            old_file.unlink(missing_ok=True)

    # Remove the previous cloud object after successful replacement.
    if (
        old_reference
        and old_reference.startswith("supabase://")
        and old_reference != new_reference
    ):
        try:
            delete_private_file(
                IMAGE_BUCKET,
                old_reference.removeprefix("supabase://"),
            )
        except Exception as error:
            print(f"Old image cleanup warning: {error}")

    return {
        "message": "Image uploaded successfully",
        "memory_id": memory.id,
        "image_url": f"/memories/{memory_id}/image",
    }


# =========================================================
# GET MEMORY IMAGE
# =========================================================

@router.get("/{memory_id}/image")
def get_memory_image(
    memory_id: int,
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(
        Memory.id == memory_id
    ).first()

    if memory is None or not memory.image_url:
        raise HTTPException(
            status_code=404,
            detail="Image not found",
        )

    enforce_media_visibility(
        memory,
        viewer_profile_id,
        db,
    )

    if memory.image_url.startswith("supabase://"):
        object_path = memory.image_url.removeprefix(
            "supabase://"
        )

        try:
            contents = download_private_file(
                IMAGE_BUCKET,
                object_path,
            )
        except Exception as error:
            print(f"Private image download failed: {error}")
            raise HTTPException(
                status_code=502,
                detail="Could not retrieve private image.",
            ) from error

        media_type = (
            mimetypes.guess_type(object_path)[0]
            or "application/octet-stream"
        )

        return Response(
            content=contents,
            media_type=media_type,
            headers={
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )

    # Local storage fallback.
    for extension in (".jpg", ".png", ".webp", ".gif"):
        file_path = IMAGE_DIR / f"memory_{memory_id}{extension}"

        if file_path.is_file():
            return FileResponse(
                file_path,
                headers={
                    "Cache-Control": "private, no-store",
                    "X-Content-Type-Options": "nosniff",
                },
            )

    raise HTTPException(
        status_code=404,
        detail="No image found for this memory",
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
    memory = db.query(Memory).filter(
        Memory.id == memory_id
    ).first()

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found",
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

    content_type = (
        (audio.content_type or "")
        .split(";")[0]
        .strip()
        .lower()
    )

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format.",
        )

    contents = await audio.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded audio is empty.",
        )

    extension = allowed_types[content_type]
    old_reference = memory.audio_url

    if storage_enabled():
        object_path = memory_object_path(
            memory.user_id,
            memory.id,
            "audio",
            extension,
        )

        upload_private_file(
            AUDIO_BUCKET,
            object_path,
            contents,
            content_type,
        )

        new_reference = f"supabase://{object_path}"

    else:
        audio_path = AUDIO_DIR / f"memory_{memory_id}{extension}"
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        audio_path.write_bytes(contents)

        new_reference = f"/memories/{memory_id}/audio"

    memory.audio_url = new_reference

    try:
        db.commit()
    except Exception:
        db.rollback()
        if (
            new_reference.startswith("supabase://")
            and new_reference != old_reference
        ):
            try:
                delete_private_file(
                    AUDIO_BUCKET,
                    new_reference.removeprefix("supabase://"),
                )
            except Exception:
                pass
        raise

    # Remove obsolete local audio formats.
    for old_extension in (
        ".webm", ".wav", ".mp3", ".m4a", ".ogg"
    ):
        old_file = AUDIO_DIR / f"memory_{memory_id}{old_extension}"

        if not storage_enabled() or old_file.suffix != extension:
            old_file.unlink(missing_ok=True)

    # Remove the previous cloud object after successful replacement.
    if (
        old_reference
        and old_reference.startswith("supabase://")
        and old_reference != new_reference
    ):
        try:
            delete_private_file(
                AUDIO_BUCKET,
                old_reference.removeprefix("supabase://"),
            )
        except Exception as error:
            print(f"Old audio cleanup warning: {error}")

    return {
        "message": "Audio uploaded successfully",
        "memory_id": memory.id,
        "audio_url": f"/memories/{memory_id}/audio",
    }


# =========================================================
# GET MEMORY AUDIO
# =========================================================

@router.get("/{memory_id}/audio")
def get_memory_audio(
    memory_id: int,
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    memory = db.query(Memory).filter(
        Memory.id == memory_id
    ).first()

    if memory is None or not memory.audio_url:
        raise HTTPException(
            status_code=404,
            detail="Audio not found",
        )

    enforce_media_visibility(
        memory,
        viewer_profile_id,
        db,
    )

    if memory.audio_url.startswith("supabase://"):
        object_path = memory.audio_url.removeprefix(
            "supabase://"
        )

        try:
            contents = download_private_file(
                AUDIO_BUCKET,
                object_path,
            )
        except Exception as error:
            print(f"Private audio download failed: {error}")
            raise HTTPException(
                status_code=502,
                detail="Could not retrieve private audio.",
            ) from error

        media_type = (
            mimetypes.guess_type(object_path)[0]
            or "application/octet-stream"
        )

        return Response(
            content=contents,
            media_type=media_type,
            headers={
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )

    # Local storage fallback.
    for extension in (
        ".webm", ".wav", ".mp3", ".m4a", ".ogg"
    ):
        audio_path = AUDIO_DIR / f"memory_{memory_id}{extension}"

        if audio_path.is_file():
            return FileResponse(
                audio_path,
                headers={
                    "Cache-Control": "private, no-store",
                    "X-Content-Type-Options": "nosniff",
                },
            )

    raise HTTPException(
        status_code=404,
        detail="No audio found for this memory",
    )


# =========================================================
# GET SINGLE MEMORY
# =========================================================

@router.get("/{memory_id}", response_model=MemoryResponse)
def get_single_memory(
    memory_id: int,
    user_id: int = 1,
    viewer_profile_id: int | None = None,
    db: Session = Depends(get_db),
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id, Memory.user_id == user_id)
        .first()
    )
    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found")

    enforce_media_visibility(memory, viewer_profile_id, db)
    return memory_to_response(memory, viewer_profile_id)


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

    if "hidden_from_profile_ids" in update_data:
        memory.hidden_from_profile_ids = validate_hidden_profiles_for_user(
            update_data["hidden_from_profile_ids"],
            memory.user_id,
            db,
        )

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
    image_ref = memory.image_url
    audio_ref = memory.audio_url
    db.delete(memory)
    db.commit()
    remove_memory_files(
     memory_id,
     image_ref=image_ref,
     audio_ref=audio_ref,
    )
    return {"message": "Memory deleted successfully"}