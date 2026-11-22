"""Cryptographic security, password hashing, and JWT tokens."""
import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

PASSWORD_ITERATIONS = 600_000
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "resource-atlas"
JWT_LIFETIME = timedelta(hours=12)


def signing_key() -> str:
    key = os.getenv("JWT_SECRET_KEY", "")
    if len(key.encode("utf-8")) < 32:
        raise RuntimeError("Set JWT_SECRET_KEY to a random value of at least 32 characters in .env.")
    return key


def hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return (
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def verify_password(password: str, salt_text: str, expected_hash: str) -> bool:
    try:
        salt = base64.urlsafe_b64decode(salt_text.encode("ascii"))
        expected = base64.urlsafe_b64decode(expected_hash.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        return False
    actual = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )
    return hmac.compare_digest(actual, expected)


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "iat": now,
            "exp": now + JWT_LIFETIME,
            "iss": JWT_ISSUER,
        },
        signing_key(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        signing_key(),
        algorithms=[JWT_ALGORITHM],
        issuer=JWT_ISSUER,
        options={"require": ["sub", "exp", "iat", "iss"]},
    )


def verify_access_token(token: str) -> dict[str, Any] | None:
    try:
        return decode_access_token(token)
    except jwt.PyJWTError:
        return None
