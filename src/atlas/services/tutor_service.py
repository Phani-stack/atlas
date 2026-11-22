"""Service layer for tutor session lifecycle and question orchestration."""
import logging
import threading
from pathlib import Path
from typing import Any

from ..infrastructure.knowledge.store import KnowledgeBase
from .tutor_engine import Tutor

from ..core.config import DATA_ROOT, PROJECT_ROOT
from ..repositories.space_repository import SpaceRepository
from ..api.tutor_serialization import public_question, tutor_status

logger = logging.getLogger(__name__)


class TutorService:
    """Manages active adaptive tutor sessions, question delivery, and grading."""

    def __init__(self, space_repo: SpaceRepository) -> None:
        self.space_repo = space_repo
        self.sessions: dict[tuple[str, str], Tutor] = {}
        self.sessions_lock = threading.Lock()

    def get_owned_space(self, user_id: str, space_id: str) -> dict[str, Any]:
        space = self.space_repo.get_by_id(user_id, space_id)
        if space is None:
            raise KeyError("Learning space not found.")
        if space["status"] != "ready" or not space.get("resources") or not space.get("roadmap"):
            raise ValueError("This learning space is not ready for practice.")
        return space

    def resolve_resource_list(self, space: dict[str, Any]) -> list[dict[str, Any]]:
        resources = space["resources"].get("resources", [])
        for resource in resources:
            local_path = resource.get("local_path")
            if local_path and not Path(local_path).is_absolute():
                resource["local_path"] = str((PROJECT_ROOT / local_path).resolve())
        return resources

    def create_tutor_instance(
        self, user_id: str, space: dict[str, Any], force_reindex: bool
    ) -> tuple[Tutor, dict[str, int]]:
        data_dir = DATA_ROOT / "users" / user_id / space["id"]
        knowledge_base = KnowledgeBase(space["topic"], data_dir=data_dir / "knowledge")
        index = knowledge_base.index_resources(self.resolve_resource_list(space), force=force_reindex)
        tutor = Tutor(space["roadmap"], knowledge_base, state_dir=data_dir / "progress")
        return tutor, index

    def get_or_start_session(
        self,
        user_id: str,
        space_id: str,
        reset: bool = False,
        reindex: bool = False,
    ) -> tuple[Tutor, dict[str, int]]:
        key = (user_id, space_id)
        space = self.get_owned_space(user_id, space_id)

        with self.sessions_lock:
            tutor = self.sessions.get(key)
            if tutor is None:
                tutor, index = self.create_tutor_instance(user_id, space, reindex)
                self.sessions[key] = tutor
            else:
                index = tutor.kb.index_resources(self.resolve_resource_list(space), force=reindex)
            if reset:
                tutor.reset()

        return tutor, index

    def get_active_tutor(self, user_id: str, space_id: str) -> Tutor:
        tutor = self.sessions.get((user_id, space_id))
        if tutor is None:
            raise LookupError("Start this space's practice session first.")
        return tutor

    def get_progress(self, user_id: str, space_id: str) -> dict[str, Any]:
        space = self.get_owned_space(user_id, space_id)
        data_dir = DATA_ROOT / "users" / user_id / space_id
        tutor = Tutor(space["roadmap"], None, state_dir=data_dir / "progress")
        return tutor_status(tutor)
