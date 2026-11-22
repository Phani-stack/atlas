"""Repository for learning space records."""
import json
import uuid
from typing import Any

from .base import BaseDatabase, now_utc_iso


class SpaceRepository:
    """Handles persistence and retrieval of user learning spaces."""

    def __init__(self, db: BaseDatabase) -> None:
        self.db = db

    def create(
        self,
        user_id: str,
        name: str,
        topic: str,
        known: str,
        goal: str,
        hours_per_week: float,
    ) -> str:
        space_id, created_at = str(uuid.uuid4()), now_utc_iso()
        with self.db.connect() as connection:
            connection.execute(
                """
                INSERT INTO learning_spaces
                    (id, user_id, name, topic, known, goal, hours_per_week, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'building', ?, ?)
                """,
                (space_id, user_id, name, topic, known, goal, hours_per_week, created_at, created_at),
            )
        return space_id

    def complete(
        self,
        user_id: str,
        space_id: str,
        resources: dict[str, Any],
        roadmap: dict[str, Any],
    ) -> None:
        with self.db.connect() as connection:
            result = connection.execute(
                """
                UPDATE learning_spaces
                SET status = 'ready', resources_json = ?, roadmap_json = ?, error_message = NULL, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    json.dumps(resources, ensure_ascii=False),
                    json.dumps(roadmap, ensure_ascii=False),
                    now_utc_iso(),
                    space_id,
                    user_id,
                ),
            )
            if result.rowcount != 1:
                raise LookupError("Learning space was not found for this user.")

    def fail(self, user_id: str, space_id: str, message: str) -> None:
        with self.db.connect() as connection:
            connection.execute(
                """
                UPDATE learning_spaces
                SET status = 'failed', error_message = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (message[:500], now_utc_iso(), space_id, user_id),
            )

    def list_by_owner(self, user_id: str) -> list[dict[str, Any]]:
        with self.db.connect() as connection:
            rows = connection.execute(
                """
                SELECT id, name, topic, status, error_message, created_at, updated_at
                FROM learning_spaces
                WHERE user_id = ?
                ORDER BY updated_at DESC, created_at DESC
                """,
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def get_by_id(self, user_id: str, space_id: str) -> dict[str, Any] | None:
        with self.db.connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, name, topic, known, goal, hours_per_week, status,
                       error_message, resources_json, roadmap_json, created_at, updated_at
                FROM learning_spaces
                WHERE id = ? AND user_id = ?
                """,
                (space_id, user_id),
            ).fetchone()
        if not row:
            return None

        space = dict(row)
        space["resources"] = json.loads(space.pop("resources_json")) if space["resources_json"] else None
        space["roadmap"] = json.loads(space.pop("roadmap_json")) if space["roadmap_json"] else None
        return space

    def get_latest_ready_by_topic(self, user_id: str, topic: str) -> dict[str, Any] | None:
        with self.db.connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, name, topic, known, goal, hours_per_week, status,
                       error_message, resources_json, roadmap_json, created_at, updated_at
                FROM learning_spaces
                WHERE user_id = ? AND topic = ? COLLATE NOCASE AND status = 'ready'
                ORDER BY updated_at DESC, created_at DESC
                LIMIT 1
                """,
                (user_id, topic),
            ).fetchone()
        if not row:
            return None

        space = dict(row)
        space["resources"] = json.loads(space.pop("resources_json")) if space["resources_json"] else None
        space["roadmap"] = json.loads(space.pop("roadmap_json")) if space["roadmap_json"] else None
        return space
