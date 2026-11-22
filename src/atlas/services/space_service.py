"""Service layer for learning space creation and lifecycle management."""
import logging
from pathlib import Path
from typing import Any

from ..core.config import DOWNLOADS_ROOT
from ..repositories.space_repository import SpaceRepository

logger = logging.getLogger(__name__)


class SpaceService:
    """Coordinates space creation, external material retrieval, and roadmap generation."""

    def __init__(self, space_repo: SpaceRepository) -> None:
        self.space_repo = space_repo

    def create_space_pipeline(
        self,
        user_id: str,
        name: str | None,
        topic: str,
        known: str,
        goal: str,
        hours_per_week: float,
        resource_finder_fn: Any,
        roadmap_generator_fn: Any,
    ) -> dict[str, Any]:
        resolved_name = name or topic
        space_id = self.space_repo.create(
            user_id=user_id,
            name=resolved_name,
            topic=topic,
            known=known,
            goal=goal,
            hours_per_week=hours_per_week,
        )
        output_root = DOWNLOADS_ROOT / "users" / user_id / space_id

        try:
            resources = resource_finder_fn(
                topic=topic,
                known=known,
                goal=goal,
                out=str(output_root),
            )
            roadmap = roadmap_generator_fn(
                resources,
                hours_per_week=hours_per_week,
                save=False,
            )
            self.space_repo.complete(user_id, space_id, resources, roadmap)
        except Exception:
            self.space_repo.fail(user_id, space_id, "Learning path generation failed. Try again.")
            logger.exception("Learning space generation failed for space %s", space_id)
            raise

        return {
            "space": {
                "id": space_id,
                "user_id": user_id,
                "name": resolved_name,
                "topic": topic,
                "known": known,
                "goal": goal,
                "hours_per_week": hours_per_week,
                "status": "ready",
            },
            "resources": resources,
            "roadmap": roadmap,
        }
