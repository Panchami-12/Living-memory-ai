
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client


# =========================================================
# PATHS AND ENVIRONMENT
# =========================================================

BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")

IMAGE_BUCKET = os.getenv(
    "SUPABASE_IMAGE_BUCKET",
    "memory-images",
)

AUDIO_BUCKET = os.getenv(
    "SUPABASE_AUDIO_BUCKET",
    "memory-audio",
)

MEDIA_STORAGE_BACKEND = os.getenv(
    "MEDIA_STORAGE_BACKEND",
    "local",
).strip().lower()

if MEDIA_STORAGE_BACKEND not in {"local", "supabase"}:
    raise RuntimeError("Invalid MEDIA_STORAGE_BACKEND setting.")


# =========================================================
# SUPABASE CONNECTION
# =========================================================

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SECRET_KEY", "").strip()

    if not url or not key:
        raise RuntimeError(
            "Supabase URL or secret key is missing."
        )

    return create_client(url, key)


def storage_enabled() -> bool:
    return MEDIA_STORAGE_BACKEND == "supabase"


# =========================================================
# PRIVATE MEDIA OBJECT PATH
# =========================================================

def memory_object_path(
    user_id: int,
    memory_id: int,
    media_type: str,
    extension: str,
) -> str:

    if media_type not in {"image", "audio"}:
        raise ValueError("Invalid media type.")

    if (
        not extension.startswith(".")
        or "/" in extension
        or "\\" in extension
    ):
        raise ValueError("Invalid media extension.")

    return (
        f"users/{user_id}/memories/"
        f"{memory_id}/{media_type}{extension.lower()}"
    )


# =========================================================
# UPLOAD PRIVATE FILE
# =========================================================

def upload_private_file(
    bucket: str,
    object_path: str,
    contents: bytes,
    content_type: str,
) -> str:

    client = get_supabase_client()

    client.storage.from_(bucket).upload(
        path=object_path,
        file=contents,
        file_options={
            "content-type": content_type,
            "cache-control": "0",
            "upsert": "true",
        },
    )

    return object_path


# =========================================================
# DOWNLOAD PRIVATE FILE
# =========================================================

def download_private_file(
    bucket: str,
    object_path: str,
) -> bytes:

    client = get_supabase_client()

    return client.storage.from_(bucket).download(
        object_path
    )


# =========================================================
# DELETE PRIVATE FILE
# =========================================================

def delete_private_file(
    bucket: str,
    object_path: str,
) -> None:

    if not object_path:
        return

    client = get_supabase_client()

    client.storage.from_(bucket).remove(
        [object_path]
    )


# =========================================================
# DELETE REMOTE REFERENCE
# =========================================================

def delete_remote_reference(
    bucket: str,
    reference: str | None,
) -> None:

    if (
        not reference
        or not reference.startswith("supabase://")
    ):
        return

    object_path = reference.removeprefix(
        "supabase://"
    )

    try:
        delete_private_file(
            bucket,
            object_path,
        )

    except Exception as error:
        print(
            f"Could not remove Supabase file: {error}"
        )


# =========================================================
# REMOVE MEMORY MEDIA FILES
# =========================================================

def remove_memory_files(
    memory_id: int,
    image_ref: str | None = None,
    audio_ref: str | None = None,
    delete_image: bool = True,
    delete_audio: bool = True,
) -> None:
    """Remove selected cloud objects and local media copies."""

    # -----------------------------------------------------
    # REMOVE IMAGE
    # -----------------------------------------------------

    if delete_image:

        delete_remote_reference(
            IMAGE_BUCKET,
            image_ref,
        )

        image_dir = (
            BACKEND_DIR
            / "storage"
            / "memory_images"
        )

        for extension in (
            ".jpg",
            ".png",
            ".webp",
            ".gif",
        ):

            path = (
                image_dir
                / f"memory_{memory_id}{extension}"
            )

            try:
                path.unlink(missing_ok=True)

            except OSError as error:
                print(
                    f"Could not remove image file: {error}"
                )

    # -----------------------------------------------------
    # REMOVE AUDIO
    # -----------------------------------------------------

    if delete_audio:

        delete_remote_reference(
            AUDIO_BUCKET,
            audio_ref,
        )

        audio_dir = (
            BACKEND_DIR
            / "storage"
            / "audio"
        )

        for extension in (
            ".webm",
            ".wav",
            ".mp3",
            ".m4a",
            ".ogg",
        ):

            path = (
                audio_dir
                / f"memory_{memory_id}{extension}"
            )

            try:
                path.unlink(missing_ok=True)

            except OSError as error:
                print(
                    f"Could not remove audio file: {error}"
                )
