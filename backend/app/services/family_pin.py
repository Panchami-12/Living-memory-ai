
import hashlib
import secrets


PIN_ITERATIONS = 310_000


def hash_family_pin(pin: str) -> str:
    """Hash a six-digit family PIN using PBKDF2-SHA256."""
    salt = secrets.token_bytes(16)

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        pin.encode("utf-8"),
        salt,
        PIN_ITERATIONS,
    )

    return (
        f"pbkdf2_sha256${PIN_ITERATIONS}"
        f"${salt.hex()}${derived.hex()}"
    )


def verify_family_pin(pin: str, stored_hash: str) -> bool:
    """Verify a family PIN without storing or exposing it."""
    try:
        algorithm, iterations, salt_hex, expected_hex = (
            stored_hash.split("$", 3)
        )

        if algorithm != "pbkdf2_sha256":
            return False

        rounds = int(iterations)

        if rounds < 100_000 or rounds > 1_000_000:
            return False

        salt = bytes.fromhex(salt_hex)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            pin.encode("utf-8"),
            salt,
            rounds,
        ).hex()

        return secrets.compare_digest(actual, expected_hex)

    except (ValueError, TypeError):
        return False
