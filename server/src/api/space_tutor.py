import logging
import threading
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..infrastructure.knowledge.store import KnowledgeBase
from ..services.tutor_engine import Tutor

from ..config import DATA_ROOT, PROJECT_ROOT
from ..database import database
from .dependencies import get_current_user
from .schemas import SpaceTutorAnswerRequest, SpaceTutorHintRequest, SpaceTutorSessionRequest, SpaceTutorReplayRequest, SpaceTutorPreferenceRequest
from .tutor_serialization import public_question, tutor_status

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/spaces/{space_id}/tutor",
    tags=["adaptive tutor"],
)
_sessions: dict[tuple[str, str], Tutor] = {}
_sessions_lock = threading.Lock()


def _owned_space(user_id: str, space_id: str) -> dict[str, Any]:
    space = database.get_space(user_id, space_id)
    if space is None:
        raise HTTPException(status_code=404, detail="Learning space not found.")
    if space["status"] != "ready" or not space.get("resources") or not space.get("roadmap"):
        raise HTTPException(status_code=409, detail="This learning space is not ready for practice.")
    return space


def _resource_list(space: dict[str, Any]) -> list[dict[str, Any]]:
    resources = space["resources"].get("resources", [])
    for resource in resources:
        local_path = resource.get("local_path")
        if local_path and not Path(local_path).is_absolute():
            resource["local_path"] = str((PROJECT_ROOT / local_path).resolve())
    return resources


def _create_tutor(user_id: str, space: dict[str, Any], force: bool) -> tuple[Tutor, dict[str, int]]:
    data_dir = DATA_ROOT / "users" / user_id / space["id"]
    knowledge_base = KnowledgeBase(space["topic"], data_dir=data_dir / "knowledge")
    index = knowledge_base.index_resources(_resource_list(space), force=force)
    tutor = Tutor(space["roadmap"], knowledge_base, state_dir=data_dir / "progress")
    return tutor, index


def _get_tutor(user_id: str, space_id: str) -> Tutor:
    tutor = _sessions.get((user_id, space_id))
    if tutor is None:
        raise HTTPException(status_code=409, detail="Start this space's practice session first.")
    return tutor


def start_space_session(
    user: dict[str, Any],
    space_id: str,
    reset: bool = False,
    reindex: bool = False,
) -> dict[str, Any]:
    key = (user["id"], space_id)
    space = _owned_space(user["id"], space_id)
    try:
        with _sessions_lock:
            tutor = _sessions.get(key)
            if tutor is None:
                tutor, index = _create_tutor(user["id"], space, reindex)
                _sessions[key] = tutor
            else:
                index = tutor.kb.index_resources(_resource_list(space), force=reindex)
            if reset:
                tutor.reset()
        return {"status": tutor_status(tutor), "index": index}
    except HTTPException:
        raise
    except (ImportError, RuntimeError) as exc:
        logger.exception("Tutor services are not ready")
        raise HTTPException(status_code=503, detail=f"Tutor setup is unavailable: {exc}") from exc
    except Exception as exc:
        logger.exception("Tutor session initialization failed for space %s", space_id)
        raise HTTPException(
            status_code=500,
            detail="Unable to prepare this practice session. Check the server logs and try again.",
        ) from exc


@router.post("/session")
def create_space_tutor_session(
    space_id: str,
    request: SpaceTutorSessionRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return start_space_session(user, space_id, reset=request.reset, reindex=request.reindex)


@router.get("/question")
def get_space_tutor_question(
    space_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        tutor = _get_tutor(user["id"], space_id)
        return {"question": public_question(tutor.next_question())}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Tutor question generation failed for space %s", space_id)
        raise HTTPException(
            status_code=500,
            detail="Unable to prepare a practice question. Check the server logs and try again.",
        ) from exc


@router.get("/progress")
def get_space_tutor_progress(
    space_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    space = _owned_space(user["id"], space_id)
    data_dir = DATA_ROOT / "users" / user["id"] / space_id
    tutor = Tutor(space["roadmap"], None, state_dir=data_dir / "progress")
    return {"status": tutor_status(tutor)}


@router.post("/answer")
def submit_space_tutor_answer(
    space_id: str,
    request: SpaceTutorAnswerRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    tutor = _get_tutor(user["id"], space_id)
    question = tutor.s.get("pending")
    if not question or question.get("id") != request.question_id:
        raise HTTPException(status_code=409, detail="This question is no longer active.")

    try:
        result = tutor.submit(question, request.answer, request.seconds)
        return {"result": result, "status": tutor_status(tutor)}
    except Exception as exc:
        logger.exception("Tutor answer submission failed for space %s", space_id)
        raise HTTPException(
            status_code=500,
            detail="Unable to evaluate this answer. Check the server logs and try again.",
        ) from exc


@router.post("/hint")
def get_space_tutor_hint(
    space_id: str,
    request: SpaceTutorHintRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    tutor = _get_tutor(user["id"], space_id)
    question = tutor.s.get("pending")
    if not question or question.get("id") != request.question_id:
        raise HTTPException(status_code=409, detail="This question is no longer active.")
    return {"hint": tutor.hint(question)}


@router.post("/skip-module")
def skip_space_tutor_module(
    space_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    tutor = _get_tutor(user["id"], space_id)
    tutor.skip_module()
    return {"status": tutor_status(tutor)}


@router.post("/replay-module")
def replay_space_tutor_module(
    space_id: str,
    request: SpaceTutorReplayRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Re-open a completed module so the learner can practice more questions on it."""
    tutor = _get_tutor(user["id"], space_id)
    replayed = tutor.replay_module(request.module_id)
    if replayed is None:
        raise HTTPException(status_code=409, detail="No module available to replay.")
    return {"replayed_module_id": replayed, "status": tutor_status(tutor)}


@router.post("/set-preference")
def set_space_tutor_preference(
    space_id: str,
    request: SpaceTutorPreferenceRequest,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Store learner question-type preferences and focus note for future question generation."""
    tutor = _get_tutor(user["id"], space_id)
    tutor.set_preference(request.focus_note, request.preferred_types)
    return {"ok": True, "status": tutor_status(tutor)}
