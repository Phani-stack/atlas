"""Config facade forwarding to core config module."""
from .core.config import DATA_ROOT, DATABASE_PATH, DOWNLOADS_ROOT, PROJECT_ROOT

__all__ = ["DATA_ROOT", "DATABASE_PATH", "DOWNLOADS_ROOT", "PROJECT_ROOT"]
