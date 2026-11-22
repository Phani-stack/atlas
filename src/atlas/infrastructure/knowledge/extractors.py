"""Multi-format text extractors and deep-citation formatters."""

import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

UA = {"User-Agent": "Mozilla/5.0 (ResourceFinder/1.0)"}
MAX_PAGES = 50


def extract_pdf(path: str | Path) -> list[tuple[str, dict]]:
    """Extracts page-by-page text from a PDF file."""
    try:
        from pypdf import PdfReader
        pages = PdfReader(str(path)).pages
        return [(p.extract_text() or "", {"page": i + 1}) for i, p in enumerate(pages[:MAX_PAGES])]
    except Exception:
        return []


def extract_docx(path: str | Path) -> list[tuple[str, dict]]:
    """Extracts paragraphs from a DOCX file."""
    try:
        import docx
        return [(p.text, {}) for p in docx.Document(str(path)).paragraphs]
    except Exception:
        return []


def extract_pptx(path: str | Path) -> list[tuple[str, dict]]:
    """Extracts slide-by-slide text from a PPTX file."""
    try:
        from pptx import Presentation
        segs = []
        for i, sl in enumerate(Presentation(str(path)).slides, 1):
            txt = "\n".join(
                sh.text_frame.text
                for sh in sl.shapes
                if getattr(sh, "has_text_frame", False) and sh.has_text_frame
            )
            segs.append((txt, {"page": i}))
        return segs
    except Exception:
        return []


def extract_web(url: str) -> list[tuple[str, dict]]:
    """Extracts clean article text from a web URL using trafilatura or HTML stripping."""
    try:
        html = requests.get(url, headers=UA, timeout=6).text
    except Exception:
        return []
    text = None
    try:
        import trafilatura
        text = trafilatura.extract(html)
    except Exception:
        pass
    if not text:
        text = re.sub(r"(?is)<(script|style|nav|footer|header)[^>]*>.*?</\1>", " ", html)
        text = re.sub(r"(?s)<[^>]+>", " ", text)
        text = re.sub(r"&\w+;", " ", text)
    return [(p, {}) for p in re.split(r"\n+", text) if len(p.strip()) > 40]


def extract_youtube_video_id(url: str) -> str:
    """Extracts YouTube 11-char video ID from any standard or shortened YouTube URL."""
    u = urlparse(url)
    if "youtu.be" in u.netloc:
        return u.path.strip("/")
    return (parse_qs(u.query).get("v") or [""])[0]


def extract_youtube_transcript(url: str) -> list[tuple[str, dict]]:
    """Extracts timed caption segments from a YouTube video."""
    from youtube_transcript_api import YouTubeTranscriptApi as Y
    vid = extract_youtube_video_id(url)
    try:
        rows = Y().fetch(vid)
    except AttributeError:
        rows = Y.get_transcript(vid)
    segs = []
    for c in rows:
        text, start = (c["text"], c["start"]) if isinstance(c, dict) else (c.text, c.start)
        segs.append((text, {"t": int(start)}))
    return segs


def extract_segments(resource: dict) -> list[tuple[str, dict]]:
    """Dispatches resource to the appropriate content extractor."""
    lp = resource.get("local_path")
    if lp and Path(lp).is_file():
        ext = Path(lp).suffix.lower()
        if ext == ".pdf":
            return extract_pdf(lp)
        if ext == ".docx":
            return extract_docx(lp)
        if ext == ".pptx":
            return extract_pptx(lp)
        if ext in (".txt", ".md", ".html"):
            return [(Path(lp).read_text(errors="ignore"), {})]
        return []
    if resource.get("type") == "video":
        return extract_youtube_transcript(resource["url"])
    if resource.get("type") == "web":
        return extract_web(resource["url"])
    return []


def format_location(hit: dict) -> str:
    """Human-readable location tag: page number for docs, MM:SS timestamp for videos."""
    if hit.get("page"):
        return f"p.{hit['page']}"
    if hit.get("t") is not None:
        return f"{hit['t'] // 60}:{hit['t'] % 60:02d}"
    return ""


def build_resource_link(hit: dict) -> str:
    """Deep link to the exact minute for video citations or canonical resource URL."""
    if hit.get("type") == "video" and hit.get("t") is not None:
        return hit["url"] + ("&" if "?" in hit["url"] else "?") + f"t={hit['t']}s"
    return hit["url"]
