"""Orchestrator and facade for learning space creation."""
import logging
from typing import Any

from .api.schemas import CreateSpaceRequest
from .config import DOWNLOADS_ROOT
from .database import database
from .resource_finder import find_resources, safe
from .roadmap_generator import generate_roadmap
from .services.space_service import SpaceService

logger = logging.getLogger(__name__)


def create_learning_space(user_id: str, request: CreateSpaceRequest) -> dict[str, Any]:
    """Create a learning space, discover materials, and build its roadmap."""
    # Obtain SpaceRepository dynamically from the current (possibly patched) database object
    space_repo = getattr(database, "spaces", None)
    if space_repo is None:
        from .repositories.space_repository import SpaceRepository
        space_repo = SpaceRepository(database)

    service = SpaceService(space_repo)
    return service.create_space_pipeline(
        user_id=user_id,
        name=request.name,
        topic=request.topic,
        known=request.known,
        goal=request.goal,
        hours_per_week=request.hours_per_week,
        resource_finder_fn=find_resources,
        roadmap_generator_fn=generate_roadmap,
    )


def space_resource_path(user_id: str, space_id: str, topic: str) -> str:
    """Return local path for downloaded materials of a space."""
    return str(DOWNLOADS_ROOT / "users" / user_id / space_id / safe(topic, 50))
