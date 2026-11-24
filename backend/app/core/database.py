import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# =========================================================
# PATHS AND ENVIRONMENT
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")

STORAGE_DIR = BASE_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DEFAULT_SQLITE_URL = f"sqlite:///{STORAGE_DIR / 'living_memory.db'}"

DATABASE_URL = (
    os.getenv("DATABASE_URL", "").strip()
    or DEFAULT_SQLITE_URL
)

# Support standard PostgreSQL URLs using the psycopg 3 driver.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1,
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )

if not (
    DATABASE_URL.startswith("sqlite:")
    or DATABASE_URL.startswith("postgresql+psycopg://")
):
    raise RuntimeError("Unsupported DATABASE_URL configuration.")


# =========================================================
# SQLALCHEMY ENGINE
# =========================================================

engine_options = {"pool_pre_ping": True}

if DATABASE_URL.startswith("sqlite:"):
    engine_options["connect_args"] = {
        "check_same_thread": False
    }

engine = create_engine(
    DATABASE_URL,
    **engine_options,
)


# =========================================================
# DATABASE SESSION
# =========================================================

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# SAFE DATABASE MIGRATIONS
# =========================================================

def add_missing_columns():
    inspector = inspect(engine)

    if "memories" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("memories")
    }

    migrations = {
        "image_url": """
            ALTER TABLE memories
            ADD COLUMN image_url VARCHAR(500)
        """,
        "audio_url": """
            ALTER TABLE memories
            ADD COLUMN audio_url VARCHAR(500)
        """,
        "profile_id": """
            ALTER TABLE memories
            ADD COLUMN profile_id INTEGER
        """,
        "hidden_from_profile_ids": """
            ALTER TABLE memories
            ADD COLUMN hidden_from_profile_ids JSON
            NOT NULL DEFAULT '[]'
        """,
    }

    for column_name, sql_statement in migrations.items():
        if column_name not in existing_columns:
            with engine.begin() as connection:
                connection.execute(text(sql_statement))

            print(f"Database updated: {column_name} column added.")
        else:
            print(f"Database already contains {column_name}.")


    # =====================================================
    # FAMILY PROFILE PIN MIGRATION
    # =====================================================

    inspector = inspect(engine)

    if "profiles" in inspector.get_table_names():

        existing_profile_columns = {
            column["name"]
            for column in inspector.get_columns("profiles")
        }

        profile_migrations = {
            "pin_hash": """
                ALTER TABLE profiles
                ADD COLUMN pin_hash VARCHAR(255)
            """,

            "pin_failed_attempts": """
                ALTER TABLE profiles
                ADD COLUMN pin_failed_attempts INTEGER
                NOT NULL DEFAULT 0
            """,

            "pin_locked_until": """
                ALTER TABLE profiles
                ADD COLUMN pin_locked_until TIMESTAMP
            """,
        }

        for column_name, sql_statement in profile_migrations.items():

            if column_name not in existing_profile_columns:

                with engine.begin() as connection:
                    connection.execute(text(sql_statement))

                print(
                    f"Database updated: {column_name} added to profiles."
                )

            else:
                print(
                    f"Database already contains profiles.{column_name}."
                )

