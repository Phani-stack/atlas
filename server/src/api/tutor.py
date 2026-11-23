from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..database import database
from .dependencies import get_current_user
from .schemas import (
    SpaceTutorAnswerRequest,
    SpaceTutorHintRequest,
    TutorAnswerRequest,
    TutorHintRequest,
    TutorQuestionRequest,
    TutorSessionRequest,
)
from .space_tutor import (
    get_space_tutor_hint,
    get_space_tutor_question,
    skip_space_tutor_module,
    start_space_session,
    submit_space_tutor_answer,
)
from .tutor_serialization import public_question as _public_question
from .tutor_serialization import tutor_status as _status

router = APIRouter(prefix="/api/tutor", tags=["adaptive tutor compatibility"])


def _owned_space_for_topic(user_id: str, topic: str) -> dict[str, Any]:
    space = database.get_latest_ready_space_by_topic(user_id, topic)
    if space is None:
        raise HTTPException(
            status_code=404,
            detail="Create a learning space for this topic before starting practice.",
        )
    return space


@router.post("/session")
def create_tutor_session(
    request: TutorSessionRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = _owned_space_for_topic(user["id"], request.topic)
    return start_space_session(
        user,
        space["id"],
        reset=request.reset,
        reindex=request.reindex,
    )


@router.post("/question")
def get_tutor_question(
    request: TutorQuestionRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = _owned_space_for_topic(user["id"], request.topic)
    return get_space_tutor_question(space["id"], user)


@router.post("/answer")
def submit_tutor_answer(
    request: TutorAnswerRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = _owned_space_for_topic(user["id"], request.topic)
    return submit_space_tutor_answer(
        space["id"],
        SpaceTutorAnswerRequest(
            question_id=request.question_id,
            answer=request.answer,
            seconds=request.seconds,
        ),
        user,
    )


@router.post("/hint")
def get_tutor_hint(
    request: TutorHintRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    space = _owned_space_for_topic(user["id"], request.topic)
    return get_space_tutor_hint(
        space["id"],
        SpaceTutorHintRequest(question_id=request.question_id),
        user,
    )


@router.post("/skip-module")
def skip_tutor_module(
    request: TutorQuestionRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = _owned_space_for_topic(user["id"], request.topic)
    return skip_space_tutor_module(space["id"], user)
