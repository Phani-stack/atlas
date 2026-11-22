"""Groq LLM Client Adapter with automatic model fallback and JSON response extraction."""

import json
import os
import re
from typing import Any

_MODELS: list[str] | None = None
_SKIP = ("whisper", "orpheus", "guard", "tts", "embed", "compound")
_PREFER = [
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
]


def groq_models(client: Any) -> list[str]:
    """Retrieve available live Groq models, sorted by speed preference."""
    try:
        ids = [m.id for m in client.models.list().data if not any(x in m.id for x in _SKIP)]
    except Exception:
        ids = []
    env = os.getenv("GROQ_MODEL")
    ordered = ([env] if env else []) + [m for m in _PREFER if m in ids] + [i for i in ids if i not in _PREFER]
    return ordered or _PREFER


def parse_json_from_text(text: str | None) -> dict[str, Any]:
    """Strip thought tags and extract JSON object from LLM response text."""
    cleaned = re.sub(r"<think>.*?</think>", "", text or "", flags=re.S)
    match = re.search(r"\{.*\}", cleaned, flags=re.S)
    if not match:
        raise ValueError("No JSON object detected in response.")
    return json.loads(match.group(0))


def llm_json(
    prompt: str,
    use_llm: bool = True,
    temperature: float = 0.2,
    models: list[str] | None = None,
) -> dict[str, Any] | None:
    """Execute prompt against Groq API, attempting json_object format with model fallback."""
    global _MODELS
    key = os.getenv("GROQ_API_KEY")
    if not (use_llm and key):
        return None

    try:
        from groq import Groq
        client = Groq(api_key=key)
    except Exception as exc:
        print(f"[llm] skipped ({str(exc)[:100]})")
        return None

    active_models = models or _MODELS
    if active_models is None:
        active_models = groq_models(client)
        if models is None:
            _MODELS = active_models

    messages = [
        {"role": "system", "content": "You reply with valid JSON only."},
        {"role": "user", "content": prompt},
    ]

    for model in list(active_models):
        for json_mode in (True, False):
            try:
                kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    **kwargs,
                )
                content = response.choices[0].message.content
                out = parse_json_from_text(content)
                if active_models[0] != model:
                    active_models.remove(model)
                    active_models.insert(0, model)
                return out
            except Exception:
                continue

    return None


llm_json_call = llm_json
