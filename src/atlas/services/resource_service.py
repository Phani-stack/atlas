"""Resource discovery and material collection service."""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from atlas.infrastructure.llm.groq_client import llm_json
from atlas.infrastructure.search.downloader import download_file, peek_pdf, safe_filename
from atlas.infrastructure.search.providers import gather_search_results

STAGES = ["foundation", "core", "advanced", "practice"]


class ResourceService:
    """Orchestrates resource query planning, search gathering, ranking, and file downloads."""

    def plan(self, topic: str, known: str = "", goal: str = "", use_llm: bool = True) -> dict[str, Any]:
        """Plans tailored queries across web, video, and paper formats directly aligned with learner goal."""
        focus = f"{topic} {goal}".strip() if goal else topic
        level_default = "intermediate" if known and known != "nothing specified" else "beginner"
        fallback = {
            "level": level_default,
            "web": [
                f"{focus} tutorial",
                f"{focus} in depth guide documentation",
                f"{focus} deep dive best practices",
                f"{focus} lecture notes slides",
                f"{focus} reference examples",
            ],
            "video": [
                f"{focus} complete course tutorial",
                f"{focus} explained step by step",
                f"{focus} deep dive",
            ],
            "paper": [focus, f"{focus} architecture design survey"],
        }
        prompt = f"""You are planning search queries to gather authoritative educational materials for a learner.
Subject/Topic: {topic}
Target Goal / Specialization: {goal or 'comprehensive mastery'}
What they ALREADY know (skip basic 101s on this; focus on bridging to the goal): {known or 'nothing specified'}

Generate highly targeted, relevant search queries directly focused on mastering "{goal or topic}".
Do NOT generate generic beginner queries if the user already knows fundamentals. Queries must target high-quality guides, documentation, slide decks, and code tutorials for "{focus}".

Return JSON:
{{"level": "{level_default}",
"web": [5 targeted search queries for documentation, in-depth tutorials, slide decks, and code examples for {focus}],
"video": [3 YouTube search queries for technical lectures, walkthroughs, and tutorials on {focus}],
"paper": [2 search queries for technical papers, specs, or surveys on {focus}]}}"""
        p = llm_json(prompt, use_llm)
        if not p:
            return fallback
        for k in fallback:
            if not p.get(k):
                p[k] = fallback[k]
        return p

    def rank(
        self,
        items: list[dict],
        topic: str,
        known: str,
        goal: str,
        level: str,
        limit: int = 60,
        use_llm: bool = True,
    ) -> list[dict]:
        """Ranks candidate items using LLM evaluation or round-robin diversity fallback."""
        for i, it in enumerate(items):
            it["id"] = i
        cand = items[:45]
        listing = "\n".join(
            f"{it['id']}|{it['type']}|{it['title'][:90]}|{urlparse(it['url']).netloc}"
            for it in cand
        )
        prompt = f"""Score each resource 0-10 for how useful it is to this learner.
Topic: {topic} | Level: {level} | Already knows: {known or 'n/a'} | Goal: {goal or 'general'}
Penalise spam, paywalls, off-topic and wrong difficulty. Reward reputable sources (universities, official docs, known channels).
Resources (id|type|title|domain):
{listing}
Return JSON: {{"scores": {{"<id>": <0-10>, ...}}}}"""
        res = llm_json(prompt, use_llm)
        if res and isinstance(res.get("scores"), dict):
            for it in cand:
                it["score"] = float(res["scores"].get(str(it["id"]), 0) or 0)
            items = [it for it in cand if it["score"] >= 4]
            items.sort(key=lambda x: -x["score"])
        else:
            buckets: dict[str, list[dict]] = {}
            for it in items:
                buckets.setdefault(it["type"], []).append(it)
            items = []
            while any(buckets.values()):
                for b in buckets.values():
                    if b:
                        items.append(b.pop(0))
            for it in items:
                it["score"] = None
        return items[:limit]

    def enrich(
        self,
        items: list[dict],
        topic: str,
        known: str,
        goal: str,
        level: str,
        use_llm: bool = True,
    ) -> dict[str, Any]:
        """Enriches resources with summaries, difficulty ratings, and curriculum stages."""
        lines = []
        for it in items[:30]:
            extra = (it.get("excerpt") or it.get("note") or "")[:200]
            lines.append(f"{it['id']}|{it['type']}|{it['title'][:90]}|{urlparse(it['url']).netloc}|{extra}")
        nl = chr(10)
        prompt = f"""You are preparing input for a learning-roadmap generator.
Learner: topic={topic}; level={level}; already knows={known or 'n/a'}; goal={goal or 'general'}
Available resources (id|type|title|domain|snippet):
{nl.join(lines)}
Return JSON:
{{"items": {{"<id>": {{"summary": "1-2 sentences on what this resource actually contains",
"difficulty": "beginner|intermediate|advanced",
"topics": ["2-5 short topic tags"],
"stage": "foundation|core|advanced|practice",
"est_minutes": <integer or null>}}}},
"roadmap_brief": "3-5 sentences: what the collection covers, how a learner with this background should progress toward the goal, and which resource types fit which stage",
"coverage_gaps": ["goal-relevant topics these resources do not cover well"]}}
Only describe what the title/snippet supports; do not invent details."""
        res = llm_json(prompt, use_llm)
        return res or {}

    def find_resources(
        self,
        topic: str,
        known: str = "",
        goal: str = "",
        out: str = "downloads",
        limit: int = 60,
        use_llm: bool = True,
    ) -> dict[str, Any]:
        """Full resource discovery and material collection pipeline."""
        root = Path(out) / safe_filename(topic, 50)
        root.mkdir(parents=True, exist_ok=True)

        print("1/5 planning queries...")
        p = self.plan(topic, known, goal, use_llm)
        level = p["level"]
        print(f"    level: {level} | {len(p['web'])} web, {len(p['video'])} video, {len(p['paper'])} paper queries")

        print("2/5 searching (parallel)...")
        items = gather_search_results(p)
        print(f"    {len(items)} unique results")

        print("3/5 ranking...")
        items = self.rank(items, topic, known, goal, level, limit, use_llm)

        print("4/5 downloading files (YouTube = links only)...")
        names = {"paper": "papers", "pdf": "pdfs", "ppt": "slides", "doc": "docs", "book": "books"}
        all_downloadables = [i for i in items if i["type"] in names]
        todo = all_downloadables[:12]
        folders = {}
        for t in {i["type"] for i in todo}:
            folders[t] = root / names[t]
            folders[t].mkdir(exist_ok=True)
        with ThreadPoolExecutor(max_workers=8) as ex:
            for it, path in zip(todo, ex.map(lambda i: download_file(i, folders[i["type"]]), todo)):
                it["local"] = path
            pdfs = [i for i in todo if i.get("local") and i["local"].endswith(".pdf")]
            for it, (pages, excerpt) in zip(pdfs, ex.map(lambda i: peek_pdf(i["local"]), pdfs)):
                it["pages"], it["excerpt"] = pages, excerpt

        print("5/5 summarising for roadmap...")
        meta = self.enrich(items, topic, known, goal, level, use_llm)
        per = meta.get("items") if isinstance(meta.get("items"), dict) else {}

        resources = []
        for it in items:
            m = per.get(str(it["id"]), {}) if isinstance(per.get(str(it["id"]), {}), dict) else {}
            stage = m.get("stage") if m.get("stage") in STAGES else None
            resources.append({
                "id": it["id"],
                "title": it["title"],
                "url": it["url"],
                "type": it["type"],
                "source": it["source"],
                "domain": urlparse(it["url"]).netloc,
                "relevance_score": it.get("score"),
                "summary": m.get("summary") or it.get("excerpt", "")[:200] or it.get("note") or "",
                "difficulty": m.get("difficulty") if m.get("difficulty") in ("beginner", "intermediate", "advanced") else level,
                "topics": m.get("topics") or [],
                "stage": stage,
                "estimated_minutes": m.get("est_minutes") if isinstance(m.get("est_minutes"), int) else it.get("duration_min"),
                "channel": it.get("channel"),
                "duration_min": it.get("duration_min"),
                "pages": it.get("pages"),
                "downloaded": bool(it.get("local")),
                "local_path": it.get("local"),
            })

        count = lambda key: {v: sum(1 for r in resources if r[key] == v) for v in sorted({r[key] for r in resources if r[key]})}
        by_stage = {
            st: [r["id"] for r in sorted((r for r in resources if r["stage"] == st), key=lambda r: -(r["relevance_score"] or 0))]
            for st in STAGES
        }
        result = {
            "topic": topic,
            "learner": {"known": known, "goal": goal, "level": level},
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "output_dir": str(root.resolve()),
            "stats": {
                "total": len(resources),
                "downloaded": sum(r["downloaded"] for r in resources),
                "by_type": count("type"),
                "by_difficulty": count("difficulty"),
                "by_stage": {st: len(ids) for st, ids in by_stage.items()},
            },
            "roadmap_context": {
                "brief": meta.get("roadmap_brief")
                or f"{len(resources)} free resources found for '{topic}' (videos, papers, PDFs, slides, docs). Learner level: {level}. Goal: {goal or 'general understanding'}.",
                "coverage_gaps": meta.get("coverage_gaps") or [],
                "resource_ids_by_stage": by_stage,
                "search_queries_used": {k: p[k] for k in ("web", "video", "paper")},
            },
            "resources": resources,
        }
        (root / "resources.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nDone. {result['stats']['total']} resources, {result['stats']['downloaded']} files downloaded")
        print(f"JSON: {root / 'resources.json'}")
        return result
