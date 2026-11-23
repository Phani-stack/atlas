"""Core configuration and environment settings for Resource Atlas."""
import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

DATA_ROOT = Path(os.getenv("TUTOR_DATA", str(PROJECT_ROOT / "tutor_data"))).expanduser().resolve()
DATABASE_PATH = Path(
    os.getenv("DATABASE_PATH", str(DATA_ROOT / "resource_atlas.sqlite3"))
).expanduser().resolve()
DOWNLOADS_ROOT = PROJECT_ROOT / "downloads"
