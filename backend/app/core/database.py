from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy import inspect
from sqlalchemy import text
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker


# =========================================================
# FIND BACKEND FOLDER
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]


# =========================================================
# DATABASE STORAGE
# =========================================================

STORAGE_DIR = BASE_DIR / "storage"

STORAGE_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# SQLITE DATABASE
# =========================================================

DATABASE_URL = (
    f"sqlite:///{STORAGE_DIR / 'living_memory.db'}"
)


# =========================================================
# SQLALCHEMY ENGINE
# =========================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
)


# =========================================================
# DATABASE SESSION
# =========================================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


# =========================================================
# BASE MODEL
# =========================================================

class Base(DeclarativeBase):
    pass


# =========================================================
# DATABASE SESSION
# =========================================================

def get_db():
    """Provide a database session to API endpoints."""

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# DATABASE MIGRATION
# =========================================================

def add_missing_columns():
    """
    Add new columns to existing SQLite tables
    without deleting existing data.
    """

    inspector = inspect(engine)

    # Check whether memories table exists
    if "memories" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("memories")
    }

    # Add image_url if it doesn't already exist
    if "image_url" not in existing_columns:

        with engine.begin() as connection:

            connection.execute(
                text(
                    """
                    ALTER TABLE memories
                    ADD COLUMN image_url VARCHAR(500)
                    """
                )
            )

        print(
            "Database updated: image_url column added."
        )

    else:
        print(
            "Database already contains image_url."
        )
        # Add audio_url if it doesn't already exist
    if "audio_url" not in existing_columns:

        with engine.begin() as connection:

            connection.execute(
                text(
                    """
                    ALTER TABLE memories
                    ADD COLUMN audio_url VARCHAR(500)
                    """
                )
            )

        print(
            "Database updated: audio_url column added."
        )

    else:
        print(
            "Database already contains audio_url."
        )
# =========================================================
# RUN DATABASE MIGRATION
# =========================================================

add_missing_columns()