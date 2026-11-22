"""Text chunking and segment packing algorithms for document preparation."""
import re
from typing import Any

CHUNK_CHARS = 1100
OVERLAP = 150


def chunk_text(text: str, size: int = CHUNK_CHARS, overlap: int = OVERLAP) -> list[str]:
    """Split long plain text into overlapping chunks, preferring paragraph or sentence boundaries."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) <= size:
        return [text] if len(text) > 80 else []
    chunks, i = [], 0
    while i < len(text):
        j = min(i + size, len(text))
        if j < len(text):
            k = max(text.rfind("\n\n", i, j), text.rfind(". ", i, j))
            if k > i + size * 0.5:
                j = k + 1
        c = text[i:j].strip()
        if len(c) > 80:
            chunks.append(c)
        if j >= len(text):
            break
        i = max(j - overlap, i + 1)
    return chunks


def pack_segments(segments: list[tuple[str, dict[str, Any]]]) -> list[tuple[str, dict[str, Any]]]:
    """Merge small text segments into ~CHUNK_CHARS chunks, preserving location metadata."""
    out, buf, meta0 = [], "", None
    for text, meta in segments:
        text = (text or "").strip()
        if not text:
            continue
        if len(text) > CHUNK_CHARS:
            if buf:
                out.append((buf, meta0))
                buf, meta0 = "", None
            out += [(c, meta) for c in chunk_text(text)]
            continue
        if buf and len(buf) + len(text) > CHUNK_CHARS:
            out.append((buf, meta0))
            buf, meta0 = "", None
        if not buf:
            meta0 = meta
        buf = (buf + "\n" + text).strip()
    if buf:
        out.append((buf, meta0))

    seen, res = set(), []
    for t, m in out:
        t_clean = t.strip()
        if len(t_clean) > 80 and t_clean not in seen:
            seen.add(t_clean)
            res.append((t_clean, m or {}))
    return res
