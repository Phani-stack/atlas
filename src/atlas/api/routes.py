import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..learning_spaces import create_learning_space
from .dependencies import get_current_user
from .schemas import CreateSpaceRequest, LearnRequest, LearnResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/learn")
def create_learning_path(
    request: LearnRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> LearnResponse:
    try:
        created = create_learning_space(
            user["id"],
            CreateSpaceRequest(
                name=request.topic,
                topic=request.topic,
                known=request.known,
                goal=request.goal,
                hours_per_week=request.hours_per_week,
            ),
        )
        return LearnResponse.model_validate(
            {"resources": created["resources"], "roadmap": created["roadmap"]}
        )
    except Exception as exc:
        logger.exception("Learning path generation failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to generate a learning path. Check the server logs and try again.",
        ) from exc
