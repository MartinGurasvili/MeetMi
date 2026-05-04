import hashlib
import hmac
import os
from base64 import b64decode, b64encode

PBKDF2_ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${b64encode(salt).decode()}${b64encode(digest).decode()}"


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        algorithm, iterations, salt, expected = hashed_password.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), b64decode(salt), int(iterations))
        return hmac.compare_digest(b64encode(digest).decode(), expected)
    except (ValueError, TypeError):
        return False
