from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
import secrets
from app.core.security import create_access_token
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import SignupRequest, LoginRequest


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ============================================================
# PASSWORD HELPERS
# ============================================================

def hash_password(password: str) -> str:
    """
    Securely hash a password using PBKDF2.
    """
    salt = secrets.token_hex(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()

    return f"{salt}${password_hash}"


def verify_password(password: str, stored_password: str) -> bool:
    """
    Verify PBKDF2 passwords and legacy SHA-256 hashes.
    Plain-text passwords are not accepted.
    """

    # Current PBKDF2 password format
    if "$" in stored_password:
        try:
            salt, saved_hash = stored_password.split("$", 1)

            password_hash = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt.encode("utf-8"),
                100000
            ).hex()

            return secrets.compare_digest(
                password_hash,
                saved_hash
            )

        except Exception:
            return False

    # Legacy SHA-256 password format
    if len(stored_password) == 64:
        legacy_hash = hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

        return secrets.compare_digest(
            legacy_hash,
            stored_password.lower()
        )

    return False

# ============================================================
# SIGNUP
# ============================================================

@router.post("/signup")
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        name=data.username,
        email=data.email,
        password=hash_password(data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Signup successful",
        "user_id": new_user.id,
        "username": new_user.name,
        "email": new_user.email
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(
        data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Upgrade legacy SHA-256 hashes to PBKDF2
    if (
        "$" not in user.password
        and len(user.password) == 64
        and all(c in "0123456789abcdefABCDEF" for c in user.password)
    ):
        user.password = hash_password(data.password)
        db.commit()

    # Generate authentication token
    access_token = create_access_token(user.id)

    # Return login details and token
    return {
        "message": "Login successful",
        "user_id": user.id,
        "username": user.name,
        "email": user.email,
        "access_token": access_token,
        "token_type": "bearer"
    }