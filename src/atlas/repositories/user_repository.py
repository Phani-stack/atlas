"""Repository for user account persistence."""
import uuid
from typing import Any

from .base import BaseDatabase, now_utc_iso


class UserRepository:
    """Handles CRUD operations for user accounts."""

    def __init__(self, db: BaseDatabase) -> None:
        self.db = db

    def create(self, email: str, password_salt: str, password_hash: str) -> dict[str, Any]:
        user_id, created_at = str(uuid.uuid4()), now_utc_iso()
        with self.db.connect() as connection:
            connection.execute(
                """
                INSERT INTO users (id, email, password_salt, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, email, password_salt, password_hash, created_at),
            )
        return {"id": user_id, "email": email, "created_at": created_at}

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        with self.db.connect() as connection:
            row = connection.execute(
                "SELECT id, email, password_salt, password_hash, created_at FROM users WHERE email = ?",
                (email,),
            ).fetchone()
        return dict(row) if row else None

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        with self.db.connect() as connection:
            row = connection.execute(
                "SELECT id, email, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        return dict(row) if row else None
