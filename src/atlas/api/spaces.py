import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import database
from ..learning_spaces import create_learning_space
from .dependencies import get_current_user
from .schemas import CreateSpaceRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/spaces", tags=["learning spaces"])


def _space_response(space: dict[str, Any]) -> dict[str, Any]:
    return {
        key: space.get(key)
        for key in (
            "id",
            "name",
            "topic",
            "known",
            "goal",
            "hours_per_week",
            "status",
            "error_message",
            "created_at",
            "updated_at",
            "resources",
            "roadmap",
        )
        if key in space
    }


@router.get("")
def list_learning_spaces(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, list[dict[str, Any]]]:
    return {"spaces": database.list_spaces(user["id"])}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_space(
    request: CreateSpaceRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        created = create_learning_space(user["id"], request)
        space = _space_response(created["space"])
        space["resources"] = created["resources"]
        space["roadmap"] = created["roadmap"]
        return space
    except Exception as exc:
        logger.exception("Unable to create a learning space")
        raise HTTPException(
            status_code=500,
            detail="Unable to create this learning space. Check the server logs and try again.",
        ) from exc


@router.get("/{space_id}")
def get_learning_space(
    space_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = database.get_space(user["id"], space_id)
    if space is None:
        raise HTTPException(status_code=404, detail="Learning space not found.")
    return _space_response(space)
