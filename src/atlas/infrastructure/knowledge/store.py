"""Vector database repository for knowledge storage and semantic retrieval via Qdrant."""

import json
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from .chunking import pack_segments
from .embeddings import check_ollama, embed_texts
from .extractors import extract_segments

BATCH_SIZE = 32
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
QDRANT_URL = os.getenv("QDRANT_URL")
DEFAULT_DATA_DIR = Path(os.getenv("TUTOR_DATA", "tutor_data"))
MAX_CHUNKS_PER_RESOURCE = 25
_GLOBAL_QUERY_CACHE: dict[str, list[float]] = {}


class KnowledgeBase:
    """Vector database index for learning resources, backed by Qdrant and Ollama embeddings."""

    def __init__(self, topic: str, data_dir: Path | str = DEFAULT_DATA_DIR):
        from qdrant_client import QdrantClient
        check_ollama()
        slug = re.sub(r"\W+", "_", topic.lower()).strip("_")[:40] or "topic"
        self.dir = Path(data_dir) / slug
        self.dir.mkdir(parents=True, exist_ok=True)
        self.name = f"res_{slug}"
        self.client = QdrantClient(url=QDRANT_URL) if QDRANT_URL else QdrantClient(path=str(self.dir / "qdrant"))
        self.manifest_path = self.dir / "index_manifest.json"
        self._qcache: dict[str, list[float]] = {}

    def _sig(self, r: dict) -> str:
        lp = r.get("local_path")
        if lp and Path(lp).is_file():
            st = Path(lp).stat()
            return f"{EMBED_MODEL}|{lp}|{st.st_size}|{int(st.st_mtime)}"
        return f"{EMBED_MODEL}|{r.get('type')}|{r.get('url')}"

    def _prepare(self, r: dict) -> list[tuple[str, dict]]:
        try:
            chunks = pack_segments(extract_segments(r))
            return chunks[:MAX_CHUNKS_PER_RESOURCE]
        except Exception as e:
            print(f"    [skip] {r.get('title', '')[:50]}: {str(e)[:70]}")
            return []

    def _ensure_collection(self, dim: int) -> None:
        from qdrant_client import models
        if not self.client.collection_exists(self.name):
            self.client.create_collection(
                self.name,
                vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE),
            )

    def _delete_resource(self, rid: Any) -> None:
        from qdrant_client import models
        if self.client.collection_exists(self.name):
            self.client.delete(
                self.name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[models.FieldCondition(key="resource_id", match=models.MatchValue(value=rid))]
                    )
                ),
            )

    def _embed_upsert(self, r: dict, chunks: list[tuple[str, dict]]) -> None:
        from qdrant_client import models
        points = []
        for s in range(0, len(chunks), BATCH_SIZE):
            part = chunks[s:s + BATCH_SIZE]
            vecs = embed_texts([t for t, _ in part])
            self._ensure_collection(len(vecs[0]))
            for k, ((text, meta), v) in enumerate(zip(part, vecs)):
                i = s + k
                points.append(
                    models.PointStruct(
                        id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{self.name}:{r['id']}:{i}")),
                        vector=v,
                        payload={
                            "resource_id": r["id"],
                            "title": r.get("title", ""),
                            "type": r.get("type"),
                            "url": r["url"],
                            "chunk": i,
                            "text": text,
                            **meta,
                        },
                    )
                )
            if len(points) >= 64:
                self.client.upsert(self.name, points=points)
                points = []
        if points:
            self.client.upsert(self.name, points=points)

    def index_resources(self, resources: list[dict], force: bool = False, workers: int = 6) -> dict[str, int]:
        """Indexes given resources into Qdrant, using manifest cache to skip unchanged resources."""
        manifest = json.loads(self.manifest_path.read_text()) if self.manifest_path.exists() else {}
        todo = [
            (r, self._sig(r))
            for r in resources
            if force or manifest.get(str(r["id"]), {}).get("sig") != self._sig(r)
        ]
        if not todo:
            print(f"Index up to date ({self.count()} chunks).")
            return {"indexed": 0, "chunks": self.count()}

        print(f"Indexing {len(todo)} resources (embeddings: {EMBED_MODEL} via Ollama)...")
        done = total = 0
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = {ex.submit(self._prepare, r): (r, sig) for r, sig in todo}
            for f in as_completed(futs):
                r, sig = futs[f]
                chunks = f.result()
                self._delete_resource(r["id"])
                if chunks:
                    self._embed_upsert(r, chunks)
                manifest[str(r["id"])] = {"sig": sig, "chunks": len(chunks)}
                self.manifest_path.write_text(json.dumps(manifest))
                done += 1
                total += len(chunks)
                print(f"    [{done}/{len(todo)}] {r.get('title', '')[:55]}  ({len(chunks)} chunks)")

        print(f"Indexed {total} new chunks.")
        return {"indexed": done, "chunks": self.count()}

    def count(self) -> int:
        """Returns the total number of chunks stored in this index."""
        try:
            return self.client.count(self.name).count if self.client.collection_exists(self.name) else 0
        except Exception:
            return 0

    def search(
        self,
        query: str,
        resource_ids: list[int] | set[int] | None = None,
        k: int = 6,
        per_resource: int = 2,
    ) -> list[dict[str, Any]]:
        """Top-k chunks, optionally restricted to resource ids, with per-resource diversity cap."""
        from qdrant_client import models
        if not self.client.collection_exists(self.name):
            return []
        if query not in _GLOBAL_QUERY_CACHE:
            _GLOBAL_QUERY_CACHE[query] = embed_texts([query], "query")[0]
        q_vec = _GLOBAL_QUERY_CACHE[query]
        flt = (
            models.Filter(
                must=[models.FieldCondition(key="resource_id", match=models.MatchAny(any=list(resource_ids)))]
            )
            if resource_ids
            else None
        )
        pts = self.client.query_points(
            self.name,
            query=q_vec,
            limit=k * 3,
            query_filter=flt,
            with_payload=True,
        ).points
        out: list[dict[str, Any]] = []
        per: dict[Any, int] = {}
        for p in pts:
            rid = p.payload["resource_id"]
            if per.get(rid, 0) >= per_resource:
                continue
            per[rid] = per.get(rid, 0) + 1
            out.append({"score": p.score, **p.payload})
            if len(out) >= k:
                break
        return out
