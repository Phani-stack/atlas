"""Resource finder and search orchestration module (facade for ResourceService and search infrastructure)."""

import json
import sys
from typing import Any

from atlas.infrastructure.llm.groq_client import (
    groq_models as _groq_models,
    llm_json as _core_llm_json,
    parse_json_from_text as _parse_json,
)
from atlas.infrastructure.search.downloader import download_file, peek_pdf, safe_filename
from atlas.infrastructure.search.providers import (
    classify_url,
    gather_search_results,
    search_arxiv,
    search_duckduckgo,
    search_openalex,
    search_youtube,
)
from atlas.services.resource_service import ResourceService

_MODELS: list[str] | None = None
safe = safe_filename
classify = classify_url
s_web = search_duckduckgo
s_youtube = search_youtube
s_arxiv = search_arxiv
s_openalex = search_openalex
gather = gather_search_results

_resource_service = ResourceService()


def llm_json(prompt: str, use_llm: bool = True, temperature: float = 0.2) -> dict[str, Any] | None:
    """Execute LLM call returning JSON, respecting any module-level _MODELS mock/override."""
    import atlas.resource_finder as self_module
    models = getattr(self_module, "_MODELS", None)
    return _core_llm_json(prompt, use_llm=use_llm, temperature=temperature, models=models)


def plan(topic: str, known: str = "", goal: str = "", use_llm: bool = True) -> dict[str, Any]:
    return _resource_service.plan(topic, known=known, goal=goal, use_llm=use_llm)


def rank(
    items: list[dict],
    topic: str,
    known: str,
    goal: str,
    level: str,
    limit: int = 60,
    use_llm: bool = True,
) -> list[dict]:
    return _resource_service.rank(items, topic, known, goal, level, limit=limit, use_llm=use_llm)


def enrich(
    items: list[dict],
    topic: str,
    known: str,
    goal: str,
    level: str,
    use_llm: bool = True,
) -> dict[str, Any]:
    return _resource_service.enrich(items, topic, known, goal, level, use_llm=use_llm)


def find_resources(topic: str, known: str = "", goal: str = "", out: str = "downloads") -> dict[str, Any]:
    return _resource_service.find_resources(topic, known=known, goal=goal, out=out)


def main():
    topic = input("Topic: ").strip()
    known = input("What do you already know about it? ").strip()
    goal = input("What is your goal? ").strip()
    if not topic:
        sys.exit("Topic required.")
    result = find_resources(topic, known, goal)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return result


if __name__ == "__main__":
    main()
