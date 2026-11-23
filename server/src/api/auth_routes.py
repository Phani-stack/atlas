import logging
import sqlite3
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import database
from ..security import create_access_token, hash_password, signing_key, verify_password
from .dependencies import get_current_user
from .schemas import LoginRequest, RegisterRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth")
TOKEN_LIFETIME_SECONDS = 12 * 60 * 60


def _session_response(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "access_token": create_access_token(user["id"]),
        "token_type": "bearer",
        "expires_in": TOKEN_LIFETIME_SECONDS,
        "user": {"id": user["id"], "email": user["email"]},
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> dict[str, Any]:
    try:
        signing_key()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    salt, digest = hash_password(request.password)
    try:
        user = database.create_user(request.email, salt, digest)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    return _session_response(user)


@router.post("/login")
def login(request: LoginRequest) -> dict[str, Any]:
    try:
        signing_key()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    user = database.get_user_by_email(request.email)
    if user is None or not verify_password(
        request.password,
        user.get("password_salt", ""),
        user.get("password_hash", ""),
    ):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _session_response(user)


@router.get("/me")
def get_profile(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, str]:
    return {"id": user["id"], "email": user["email"]}
