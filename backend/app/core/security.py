
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

def _encode_token(payload: dict) -> str:
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_access_token(user_id: int) -> str:
    """Existing owner login token. Kept backward compatible."""
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "token_type": "owner",
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return _encode_token(payload)


def create_family_access_token(
    user_id: int,
    profile_id: int,
) -> str:
    """Restricted token for one family profile."""
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "token_type": "family",
        "profile_id": int(profile_id),
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return _encode_token(payload)


# =========================================================
# AUTHENTICATION CONTEXT
# =========================================================

def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> dict:

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
        token_type = payload.get("token_type", "owner")

        if token_type not in ("owner", "family"):
            raise unauthorized

    except (InvalidTokenError, TypeError, ValueError):
        raise unauthorized

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise unauthorized

    profile_id = None

    if token_type == "family":
        try:
            profile_id = int(payload.get("profile_id"))
        except (TypeError, ValueError):
            raise unauthorized

        # Import locally to avoid circular imports.
        from app.models.profile import Profile

        profile = db.query(Profile).filter(
            Profile.id == profile_id,
            Profile.user_id == user.id,
            Profile.pin_hash.isnot(None),
        ).first()

        # Removing a PIN also invalidates existing family sessions.
        if profile is None:
            raise unauthorized

    return {
        "user": user,
        "token_type": token_type,
        "profile_id": profile_id,
    }


# =========================================================
# AUTHENTICATED USER
# =========================================================

def get_current_user(
    auth: dict = Depends(get_auth_context),
) -> User:
    return auth["user"]


# =========================================================
# REQUEST OWNERSHIP AND FAMILY ACCESS CHECK
# =========================================================

async def authorize_request_user(
    request: Request,
    auth: dict = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> User:

    current_user = auth["user"]
    token_type = auth["token_type"]
    family_profile_id = auth["profile_id"]

    # Import models locally to avoid circular imports.
    from app.models.memory import Memory
    from app.models.profile import Profile
    from app.models.time_capsule import TimeCapsule

    path = request.url.path.rstrip("/")

    # -----------------------------------------------------
    # FAMILY SESSION: READ-ONLY MEMORY ACCESS
    # -----------------------------------------------------

    if token_type == "family":

        is_memory_route = (
            path == "/memories"
            or path.startswith("/memories/")
        )

        is_family_chat = (
            path == "/memories/chat"
            and request.method == "POST"
        )

        if not is_memory_route:
            raise HTTPException(
                status_code=403,
                detail="Family accounts cannot access this resource.",
            )

        if request.method != "GET" and not is_family_chat:
            raise HTTPException(
                status_code=403,
                detail="Family accounts have read-only access.",
            )

    # -----------------------------------------------------
    # READ REQUEST BODY WHEN JSON
    # -----------------------------------------------------

    body = {}

    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            parsed_body = await request.json()

            if isinstance(parsed_body, dict):
                body = parsed_body

        except Exception:
            pass

    # -----------------------------------------------------
    # VERIFY ALL SUPPLIED OWNER IDS
    # -----------------------------------------------------

    supplied_ids = request.query_params.getlist("user_id")

    if "user_id" in body:
        supplied_ids.append(body["user_id"])

    route = request.scope.get("route")
    endpoint = getattr(route, "endpoint", None)

    if endpoint and "user_id" in inspect.signature(endpoint).parameters:
        if not supplied_ids:
            raise HTTPException(
                status_code=400,
                detail="user_id is required.",
            )

    if token_type == "family" and not supplied_ids:
        raise HTTPException(
            status_code=400,
            detail="Owner account ID is required.",
        )

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

    # -----------------------------------------------------
    # FAMILY SESSION: VIEWER ID MUST MATCH TOKEN
    # -----------------------------------------------------

    if token_type == "family":

        if request.method == "POST":
            supplied_viewers = (
                [body["viewer_profile_id"]]
                if "viewer_profile_id" in body
                else []
            )
        else:
            supplied_viewers = request.query_params.getlist(
                "viewer_profile_id"
            )

        if len(supplied_viewers) != 1:
            raise HTTPException(
                status_code=403,
                detail="Family viewer identity is required.",
            )

        try:
            supplied_viewer_id = int(supplied_viewers[0])
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=403,
                detail="Invalid family viewer identity.",
            )

        if supplied_viewer_id != family_profile_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot view memories as another family member.",
            )

        request.state.viewer_profile_id = family_profile_id
        request.state.family_user_id = current_user.id
        request.state.is_family_session = True

    else:
        request.state.viewer_profile_id = None
        request.state.family_user_id = current_user.id
        request.state.is_family_session = False

    # -----------------------------------------------------
    # VERIFY RESOURCE OWNERSHIP IN URL
    # -----------------------------------------------------

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
