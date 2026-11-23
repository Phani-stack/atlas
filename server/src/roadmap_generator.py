"""Roadmap generation module (facade for RoadmapService)."""

import json
import sys
from typing import Any

from .resource_finder import find_resources, llm_json, safe
from .services.roadmap_service import (
    DEFAULT_MIN,
    DIFF_RANK,
    DIFF_TO_STAGE,
    STAGE_ORDER,
    RoadmapService,
    _load_data as _load,
)

_roadmap_service = RoadmapService()

render_roadmap_image = _roadmap_service.render_image


def design_with_llm(data: dict, rs: list[dict]) -> dict[str, Any] | None:
    return _roadmap_service.design_with_llm(data, rs)


def design_fallback(data: dict, rs: list[dict]) -> dict[str, Any]:
    return _roadmap_service.design_fallback(data, rs)


def assemble(raw: Any, data: dict, by_id: dict, hours_per_week: float = 7) -> dict[str, Any] | None:
    return _roadmap_service.assemble(raw, data, by_id, hours_per_week=hours_per_week)


def _has_all_stages(result: dict[str, Any] | None) -> bool:
    """Check that the assembled roadmap covers all four stages."""
    if not result or not isinstance(result.get("phases"), list):
        return False
    stages = {p.get("stage") for p in result["phases"] if isinstance(p, dict)}
    return all(s in stages for s in STAGE_ORDER)


def generate_roadmap(resources_data: Any, hours_per_week: float = 7, save: bool = True) -> dict[str, Any]:
    """Generates roadmap, dynamically resolving design functions to allow mock patching."""
    import src.roadmap_generator as self_module

    data, folder = _load(resources_data)
    rs = data.get("resources") or []
    by_id = {r["id"]: r for r in rs}
    if not rs:
        raise ValueError("No resources in input JSON.")

    print("Designing roadmap...")
    design_fn = getattr(self_module, "design_with_llm", _roadmap_service.design_with_llm)
    assemble_fn = getattr(self_module, "assemble", _roadmap_service.assemble)
    fallback_fn = getattr(self_module, "design_fallback", _roadmap_service.design_fallback)

    raw, mode = design_fn(data, rs), "llm"
    result = assemble_fn(raw, data, by_id, hours_per_week) if raw else None
    if not result or not _has_all_stages(result) or not any(
        m["resources"]["primary"] for p in result["phases"] for m in p["modules"]
    ):
        print("    (LLM unavailable or invalid output -> deterministic fallback roadmap)")
        mode = "fallback"
        result = assemble_fn(fallback_fn(data, rs), data, by_id, hours_per_week)

    from datetime import datetime, timezone
    from pathlib import Path

    roadmap = {
        "topic": data.get("topic"),
        "learner": data.get("learner"),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "mode": mode,
        **result,
    }
    if save:
        out_dir = Path("roadmaps")
        out_dir.mkdir(exist_ok=True)
        base = safe(str(roadmap["topic"]), 50)
        try:
            render_fn = getattr(self_module, "render_roadmap_image", _roadmap_service.render_image)
            roadmap["image_path"] = render_fn(roadmap, out_dir / f"{base}_roadmap.png")
            print(f"Roadmap image: {roadmap['image_path']}")
        except ImportError:
            roadmap["image_path"] = None
            print("Roadmap image skipped: run  pip install pillow")
        (out_dir / f"{base}_roadmap.json").write_text(json.dumps(roadmap, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Roadmap JSON : {out_dir / (base + '_roadmap.json')}")
    return roadmap


def learn(topic: str, known: str = "", goal: str = "", out: str = "downloads", hours_per_week: float = 7) -> dict[str, Any]:
    """Full pipeline: find and download materials, then design roadmap."""
    import src.roadmap_generator as self_module
    find_fn = getattr(self_module, "find_resources", find_resources)
    gen_fn = getattr(self_module, "generate_roadmap", generate_roadmap)
    resources = find_fn(topic, known, goal, out)
    return {"resources": resources, "roadmap": gen_fn(resources, hours_per_week)}


def main():
    if len(sys.argv) > 1:
        roadmap = generate_roadmap(sys.argv[1])
    else:
        topic = input("Topic: ").strip()
        known = input("What do you already know about it? ").strip()
        goal = input("What is your goal? ").strip()
        if not topic:
            sys.exit("Topic required.")
        roadmap = learn(topic, known, goal)["roadmap"]
    print(json.dumps(roadmap, indent=2, ensure_ascii=False))
    return roadmap


if __name__ == "__main__":
    main()
