
import os
import inspect
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from dotenv import load_dotenv

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User


# =========================================================
# JWT CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

bearer_scheme = HTTPBearer(auto_error=False)


# =========================================================
# TOKEN GENERATION
# =========================================================

def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# =========================================================
# AUTHENTICATED USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = int(payload.get("sub"))

    except (InvalidTokenError, TypeError, ValueError):
        raise unauthorized

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise unauthorized

    return user


# =========================================================
# REQUEST OWNERSHIP CHECK
# =========================================================

async def authorize_request_user(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:

    # Import models here to avoid circular imports.
    from app.models.memory import Memory
    from app.models.profile import Profile
    from app.models.time_capsule import TimeCapsule

    supplied_ids = request.query_params.getlist("user_id")

    # Read JSON body without exposing its contents.
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()

            if isinstance(body, dict) and "user_id" in body:
                supplied_ids.append(body["user_id"])

        except Exception:
            pass

    # Require an explicit user_id wherever the endpoint
    # accepts one, including endpoints with default user_id=1.
    route = request.scope.get("route")
    endpoint = getattr(route, "endpoint", None)

    if endpoint and "user_id" in inspect.signature(endpoint).parameters:
        if not supplied_ids:
            raise HTTPException(
                status_code=400,
                detail="user_id is required.",
            )

    # Verify every supplied user_id.
    for supplied_id in supplied_ids:
        try:
            if isinstance(supplied_id, bool):
                raise ValueError()

            supplied_id = int(supplied_id)

        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Invalid user_id.",
            )

        if supplied_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access another user's data.",
            )

    # Verify ownership of resources identified in the URL.
    resource_models = {
        "memory_id": Memory,
        "profile_id": Profile,
        "capsule_id": TimeCapsule,
    }

    for parameter, model in resource_models.items():
        raw_id = request.path_params.get(parameter)

        if raw_id is None:
            continue

        try:
            resource_id = int(raw_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=404,
                detail="Resource not found.",
            )

        resource = db.query(model).filter(
            model.id == resource_id,
            model.user_id == current_user.id,
        ).first()

        if resource is None:
            raise HTTPException(
                status_code=404,
                detail="Resource not found.",
            )

    return current_user
