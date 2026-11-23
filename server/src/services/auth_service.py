"""Service layer for authentication and account operations."""
from typing import Any

from ..core.security import create_access_token, hash_password, verify_access_token, verify_password
from ..repositories.user_repository import UserRepository


class AuthenticationError(Exception):
    """Raised when authentication credentials or token are invalid."""
    pass


class DuplicateUserError(Exception):
    """Raised when an email address is already registered."""
    pass


class AuthService:
    """Orchestrates account registration, sign-in, and token verification."""

    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def register(self, email: str, password: str) -> dict[str, Any]:
        normalized_email = email.strip().lower()
        if self.user_repo.get_by_email(normalized_email):
            raise DuplicateUserError("An account with that email already exists.")

        salt, pwd_hash = hash_password(password)
        created_user = self.user_repo.create(normalized_email, salt, pwd_hash)
        token = create_access_token(created_user["id"])

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 43200,
            "user": {"id": created_user["id"], "email": created_user["email"]},
        }

    def login(self, email: str, password: str) -> dict[str, Any]:
        normalized_email = email.strip().lower()
        user_record = self.user_repo.get_by_email(normalized_email)
        if not user_record or not verify_password(password, user_record["password_salt"], user_record["password_hash"]):
            raise AuthenticationError("Incorrect email or password.")

        token = create_access_token(user_record["id"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 43200,
            "user": {"id": user_record["id"], "email": user_record["email"]},
        }

    def authenticate_token(self, token: str) -> dict[str, Any]:
        payload = verify_access_token(token)
        if not payload or not payload.get("sub"):
            raise AuthenticationError("Invalid or expired session token.")

        user = self.user_repo.get_by_id(payload["sub"])
        if not user:
            raise AuthenticationError("User session no longer exists.")
        return user
