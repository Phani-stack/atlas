"""Ollama embeddings client for nomic-embed-text."""
import os
import requests

OLLAMA = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

_session: requests.Session | None = None


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
    return _session


def check_ollama() -> None:
    """Verify Ollama host connectivity and verify nomic-embed-text model is present."""
    sess = _get_session()
    try:
        tags = sess.get(f"{OLLAMA}/api/tags", timeout=3).json().get("models", [])
    except Exception as exc:
        raise RuntimeError(f"Ollama is not reachable at {OLLAMA}. Start it with:  ollama serve") from exc
    if not any(m.get("name", "").startswith(EMBED_MODEL) for m in tags):
        raise RuntimeError(f"Embedding model missing. Run:  ollama pull {EMBED_MODEL}")


def embed_texts(texts: list[str], kind: str = "document") -> list[list[float]]:
    """Generate dense vector embeddings using nomic-embed-text prefix conventions."""
    if not texts:
        return []
    prefix = "search_document: " if kind == "document" else "search_query: "
    payload = [prefix + t for t in texts]
    sess = _get_session()
    response = sess.post(f"{OLLAMA}/api/embed", json={"model": EMBED_MODEL, "input": payload}, timeout=120)
    if response.status_code == 404:
        return [
            sess.post(
                f"{OLLAMA}/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": p},
                timeout=30,
            ).json()["embedding"]
            for p in payload
        ]
    response.raise_for_status()
    return response.json()["embeddings"]
