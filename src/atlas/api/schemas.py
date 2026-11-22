from typing import Any

from pydantic import BaseModel, Field, field_validator


class LearnRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=120)
    known: str = Field(default="", max_length=500)
    goal: str = Field(default="", max_length=500)
    hours_per_week: float = Field(default=7, gt=0, le=80)

    @field_validator("topic")
    @classmethod
    def topic_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Topic cannot be blank.")
        return value

    @field_validator("known", "goal")
    @classmethod
    def strip_optional_text(cls, value: str) -> str:
        return value.strip()


class LearnResponse(BaseModel):
    resources: dict[str, Any]
    roadmap: dict[str, Any]


class TutorSessionRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=120)
    reset: bool = False
    reindex: bool = False

    @field_validator("topic")
    @classmethod
    def tutor_topic_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Topic cannot be blank.")
        return value


class TutorQuestionRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=120)

    @field_validator("topic")
    @classmethod
    def tutor_question_topic_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Topic cannot be blank.")
        return value


class TutorAnswerRequest(TutorQuestionRequest):
    question_id: str = Field(min_length=1, max_length=32)
    answer: str = Field(max_length=10000)
    seconds: int | None = Field(default=None, ge=0, le=86400)


class TutorHintRequest(TutorQuestionRequest):
    question_id: str = Field(min_length=1, max_length=32)


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if value.count("@") != 1 or "." not in value.rsplit("@", 1)[-1] or any(c.isspace() for c in value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, value: str) -> str:
        return value.strip().lower()


class CreateSpaceRequest(LearnRequest):
    name: str | None = Field(default=None, min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def normalize_space_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class SpaceTutorSessionRequest(BaseModel):
    reset: bool = False
    reindex: bool = False


class SpaceTutorAnswerRequest(BaseModel):
    question_id: str = Field(min_length=1, max_length=32)
    answer: str = Field(max_length=10000)
    seconds: int | None = Field(default=None, ge=0, le=86400)


class SpaceTutorHintRequest(BaseModel):
    question_id: str = Field(min_length=1, max_length=32)


class SpaceTutorReplayRequest(BaseModel):
    module_id: str | None = Field(default=None, max_length=32)


class SpaceTutorPreferenceRequest(BaseModel):
    focus_note: str = Field(default="", max_length=400)
    preferred_types: list[str] = Field(default_factory=list)
