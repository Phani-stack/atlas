"""Search provider adapters for Web, YouTube, ArXiv, and OpenAlex."""

import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

UA = {"User-Agent": "Mozilla/5.0 (ResourceFinder/1.0)"}
EXT_TYPE = {".pdf": "pdf", ".ppt": "ppt", ".pptx": "ppt", ".doc": "doc", ".docx": "doc", ".epub": "book"}


def classify_url(url: str) -> str:
    """Classifies a URL into a resource type (video, paper, book, pdf, doc, ppt, web)."""
    host = urlparse(url).netloc.lower()
    ext = Path(urlparse(url).path).suffix.lower()
    if "youtube.com" in host or "youtu.be" in host:
        return "video"
    if ext in EXT_TYPE:
        return EXT_TYPE[ext]
    if "arxiv.org" in host:
        return "paper"
    return "web"


def search_duckduckgo(q: str, kind: str | None = None, n: int = 10) -> list[dict[str, Any]]:
    """Searches DuckDuckGo for web pages or specific file types."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS
        suffix = {"pdf": " filetype:pdf", "ppt": " filetype:pptx", "doc": " filetype:docx"}.get(kind, "")
        out = []
        for r in DDGS(timeout=8).text(q + suffix, max_results=n):
            url = r.get("href") or r.get("url")
            if url:
                out.append({
                    "title": r.get("title", url),
                    "url": url,
                    "type": classify_url(url),
                    "source": "web",
                    "note": (r.get("body") or "")[:160],
                })
        return out
    except Exception as e:
        print(f"[web] '{q}' failed: {str(e)[:80]}")
        return []


def search_youtube(q: str, n: int = 8) -> list[dict[str, Any]]:
    """Searches YouTube using yt-dlp metadata extraction."""
    try:
        import yt_dlp
        with yt_dlp.YoutubeDL({"quiet": True, "extract_flat": True, "skip_download": True, "no_warnings": True}) as y:
            info = y.extract_info(f"ytsearch{n}:{q}", download=False)
        out = []
        for e in info.get("entries", []):
            if not e:
                continue
            url = e.get("url") or f"https://www.youtube.com/watch?v={e.get('id')}"
            mins = int((e.get("duration") or 0) // 60)
            out.append({
                "title": e.get("title", url),
                "url": url,
                "type": "video",
                "source": "youtube",
                "note": f"{e.get('channel') or e.get('uploader') or ''} | {mins} min",
                "channel": e.get("channel") or e.get("uploader"),
                "duration_min": mins or None,
            })
        return out
    except Exception as e:
        print(f"[youtube] '{q}' failed: {str(e)[:80]}")
        return []


def search_arxiv(q: str, n: int = 8) -> list[dict[str, Any]]:
    """Searches ArXiv API for open academic papers."""
    try:
        r = requests.get(
            "https://export.arxiv.org/api/query",
            headers=UA,
            timeout=8,
            params={"search_query": f"all:{q}", "max_results": n, "sortBy": "relevance"},
        )
        ns = {"a": "http://www.w3.org/2005/Atom"}
        out = []
        for e in ET.fromstring(r.text).findall("a:entry", ns):
            abs_url = e.find("a:id", ns).text.strip()
            title = re.sub(r"\s+", " ", e.find("a:title", ns).text or "").strip()
            summ = re.sub(r"\s+", " ", e.find("a:summary", ns).text or "").strip()[:160]
            out.append({
                "title": title,
                "url": abs_url.replace("/abs/", "/pdf/") + ".pdf",
                "type": "paper",
                "source": "arxiv",
                "note": summ,
            })
        return out
    except Exception as e:
        print(f"[arxiv] '{q}' failed: {str(e)[:80]}")
        return []


def search_openalex(q: str, n: int = 8) -> list[dict[str, Any]]:
    """Searches OpenAlex API for open access works."""
    try:
        r = requests.get(
            "https://api.openalex.org/works",
            headers=UA,
            timeout=8,
            params={"search": q, "filter": "open_access.is_oa:true", "per-page": n},
        )
        out = []
        for w in r.json().get("results", []):
            pdf = (w.get("best_oa_location") or {}).get("pdf_url")
            if pdf:
                out.append({
                    "title": w.get("title") or pdf,
                    "url": pdf,
                    "type": "paper",
                    "source": "openalex",
                    "note": f"{w.get('publication_year')} | cited {w.get('cited_by_count')}",
                })
        return out
    except Exception as e:
        print(f"[openalex] '{q}' failed: {str(e)[:80]}")
        return []


def gather_search_results(plan: dict[str, list[str]], max_workers: int = 12) -> list[dict[str, Any]]:
    """Runs parallel searches across all configured query categories."""
    jobs: list[tuple[Any, tuple]] = []
    web_queries = plan.get("web", [])
    for q in web_queries:
        jobs.append((search_duckduckgo, (q, None)))
    # Targeted document and slide searches for primary topics (avoiding combinatorial explosion)
    if web_queries:
        jobs.append((search_duckduckgo, (web_queries[0], "pdf")))
        if len(web_queries) > 1:
            jobs.append((search_duckduckgo, (web_queries[1], "ppt")))

    for q in plan.get("video", []):
        jobs.append((search_youtube, (q,)))
    for q in plan.get("paper", []):
        jobs += [
            (search_arxiv, (q,)),
            (search_openalex, (q,)),
        ]

    seen = set()
    items = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        for res in ex.map(lambda j: j[0](*j[1]), jobs):
            for it in res:
                key = re.sub(r"[?#].*$", "", it["url"]).rstrip("/").lower()
                if key not in seen:
                    seen.add(key)
                    items.append(it)
    return items
