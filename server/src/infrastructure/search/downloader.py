"""File downloading and document inspection utilities."""

import re
from pathlib import Path
from urllib.parse import urlparse

import requests

from .providers import EXT_TYPE, UA

MAX_FILE_MB = 60


def safe_filename(s: str, n: int = 80) -> str:
    """Sanitizes text for safe cross-platform filesystem names."""
    return re.sub(r"[^\w\-. ]+", "", str(s or "")).strip().replace(" ", "_")[:n] or "file"


def download_file(item: dict, folder: Path, max_file_mb: int = MAX_FILE_MB) -> str | None:
    """Downloads a file resource safely into the specified directory."""
    ext = Path(urlparse(item["url"]).path).suffix.lower()
    if ext not in EXT_TYPE:
        ext = {"pdf": ".pdf", "paper": ".pdf", "ppt": ".pptx", "doc": ".docx", "book": ".epub"}.get(item["type"], ".bin")
    dest = folder / f"{item['id']:03d}_{safe_filename(item['title'])}{ext}"
    try:
        with requests.get(item["url"], headers=UA, stream=True, timeout=(4, 10), allow_redirects=True) as r:
            r.raise_for_status()
            content_len = int(r.headers.get("content-length", 0) or 0)
            if content_len > max_file_mb * 1024 * 1024:
                return None
            chunks = r.iter_content(65536)
            first = next(chunks, b"")
            if item["type"] in ("pdf", "paper") and not first.startswith(b"%PDF"):
                return None  # HTML landing page, not a real PDF
            if b"<html" in first[:600].lower() or b"<!doctype" in first[:600].lower():
                return None
            size = len(first)
            with open(dest, "wb") as f:
                f.write(first)
                for c in chunks:
                    size += len(c)
                    if size > max_file_mb * 1024 * 1024:
                        raise ValueError("File exceeds maximum allowed size")
                    f.write(c)
        return str(dest)
    except Exception:
        dest.unlink(missing_ok=True)
        return None


def peek_pdf(path: str | Path) -> tuple[int | None, str]:
    """Extracts page count and leading text from a PDF for context enrichment."""
    try:
        from pypdf import PdfReader
        r = PdfReader(str(path))
        n = len(r.pages)
        txt = " ".join((r.pages[i].extract_text() or "") for i in range(min(2, n)))
        return n, re.sub(r"\s+", " ", txt).strip()[:400]
    except Exception:
        return None, ""
