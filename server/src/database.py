"""Database facade providing backwards-compatible unified interface over domain repositories."""
from pathlib import Path
from typing import Any

from .core.config import DATABASE_PATH
from .repositories import BaseDatabase, SpaceRepository, UserRepository


class Database(BaseDatabase):
    """Facade composing BaseDatabase, UserRepository, and SpaceRepository."""

    def __init__(self, path: Path = DATABASE_PATH) -> None:
        super().__init__(path)
        self.users = UserRepository(self)
        self.spaces = SpaceRepository(self)

    # User operations
    def create_user(self, email: str, password_salt: str, password_hash: str) -> dict[str, Any]:
        return self.users.create(email, password_salt, password_hash)

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        return self.users.get_by_email(email)

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self.users.get_by_id(user_id)

    # Learning space operations
    def create_space(
        self,
        user_id: str,
        name: str,
        topic: str,
        known: str,
        goal: str,
        hours_per_week: float,
    ) -> str:
        return self.spaces.create(user_id, name, topic, known, goal, hours_per_week)

    def complete_space(
        self,
        user_id: str,
        space_id: str,
        resources: dict[str, Any],
        roadmap: dict[str, Any],
    ) -> None:
        self.spaces.complete(user_id, space_id, resources, roadmap)

    def fail_space(self, user_id: str, space_id: str, message: str) -> None:
        self.spaces.fail(user_id, space_id, message)

    def list_spaces(self, user_id: str) -> list[dict[str, Any]]:
        return self.spaces.list_by_owner(user_id)

    def get_latest_ready_space_by_topic(self, user_id: str, topic: str) -> dict[str, Any] | None:
        return self.spaces.get_latest_ready_by_topic(user_id, topic)

    def get_space(self, user_id: str, space_id: str) -> dict[str, Any] | None:
        return self.spaces.get_by_id(user_id, space_id)


database = Database()
