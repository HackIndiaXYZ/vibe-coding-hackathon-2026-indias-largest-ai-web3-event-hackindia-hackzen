import os
import json
import time
import logging
from typing import Dict, Any

# pyrefly: ignore [missing-import]
from openai import OpenAI

# Local imports for prompt building and optional caching utilities
try:
    from .gemini_client import build_recommendation_prompt
except Exception as e:
    raise ImportError("Failed to import build_recommendation_prompt from gemini_client") from e

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
_OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
# Base URL for OpenRouter. Users can override via env if needed.
_OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
# Default model – free tier of 120B parameters (as per user example)
_OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")

# ---------------------------------------------------------------------------
# Simple in‑memory cache (mirrors the behaviour of gemini_client)
# ---------------------------------------------------------------------------
_CACHE_TTL = int(os.getenv("OPENROUTER_CACHE_TTL", "3600"))  # seconds (default 1 h)
_cache: Dict[str, Dict] = {}

def _make_key(prompt: str) -> str:
    """Create a deterministic cache key from the prompt only.
    OpenRouter does not have multiple model aliases the same way Gemini does, so we keep it simple.
    """
    return f"openrouter:{hash(prompt)}"

def _get_cached(prompt: str) -> Any:
    key = _make_key(prompt)
    entry = _cache.get(key)
    if entry and (entry["ts"] + _CACHE_TTL) > time.time():
        return entry["data"]
    return None

def _set_cached(prompt: str, data: Dict) -> None:
    key = _make_key(prompt)
    _cache[key] = {"ts": time.time(), "data": data}

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_ai_recommendation(
    scan_results: Dict,
    modules: list,
    domain_info: Dict,
    score_info: Dict,
) -> Dict[str, Any]:
    """Generate a recommendation using OpenRouter.

    The function builds the same prompt used by the Gemini client, invokes the OpenRouter
    endpoint (via the OpenAI SDK) with ``reasoning`` enabled, extracts the JSON block
    from the model's response, and returns a dictionary that mirrors the structure
    returned by ``gemini_client.get_ai_recommendation``.
    """
    if not _OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY not configured in .env")
        return {"error": "OPENROUTER_API_KEY not configured on the server.", "source": "openrouter"}

    prompt = build_recommendation_prompt(scan_results, modules, domain_info, score_info)

    # Check cache first
    cached = _get_cached(prompt)
    if cached:
        return {**cached, "cached": True}

    client = OpenAI(base_url=_OPENROUTER_BASE_URL, api_key=_OPENROUTER_API_KEY)
    try:
        response = client.chat.completions.create(
            model=_OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            extra_body={"reasoning": {"enabled": True}},
            stream=False,
        )
        # The OpenAI SDK returns a response object with ``choices``
        content = response.choices[0].message.content
        # Extract JSON
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx : end_idx + 1]
        else:
            json_str = content
        data = json.loads(json_str)
        data["source"] = "openrouter"
        data["model"] = _OPENROUTER_MODEL
        data["cached"] = False
        _set_cached(prompt, data)
        return data
    except json.JSONDecodeError as e:
        logger.error("OpenRouter returned non‑JSON response: %s", e)
        snippet = content[:200] if "content" in locals() else "Empty response"
        return {"error": f"OpenRouter non‑JSON response: {snippet}", "source": "openrouter"}
    except Exception as e:
        logger.error("OpenRouter API call failed: %s", e)
        return {"error": str(e), "source": "openrouter"}
