import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from app.core.database import (
    Base,
    engine,
    add_missing_columns,
)

from app.models import User, Memory, Profile
from app.models.time_capsule import TimeCapsule
from app.api.profiles import router as profiles_router
from app.api.memory import router as memory_router
from app.api.user import router as user_router
from app.api.time_capsules import router as time_capsules_router

# =========================================================
# PATHS AND STORAGE
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[1]

UPLOAD_DIR = BASE_DIR / "storage" / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)

add_missing_columns()


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Living Memory AI API",
    description="Backend API for Living Memory AI",
    version="0.1.0",
)


# =========================================================
# CORS
# =========================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# SERVE UPLOADED FILES
# =========================================================

# Public static uploads disabled; private media uses authenticated memory endpoints.
# =========================================================
# ROUTERS
# =========================================================

app.include_router(memory_router)
app.include_router(user_router)
app.include_router(profiles_router)
app.include_router(time_capsules_router)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Living Memory AI API is running"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error),
        }
