"""
gemini_client.py
Backend-only Gemini AI client. The API key is NEVER forwarded to the frontend.
"""
import os
import json
import time
import logging
import requests
from typing import Dict, Any, Optional
# pyrefly: ignore [missing-import]
from openai import OpenAI

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Gemini configuration (kept for backwards compatibility)
_API_KEY = os.getenv("GEMINI_API_KEY", "")
_CACHE_TTL = int(os.getenv("GEMINI_CACHE_TTL", "3600"))   # seconds (default 1 h)

# Free‑LLM configuration – if these variables are set the client will use the free service instead of Gemini
_FREE_LLM_URL = os.getenv("FREE_LLM_API_URL")          # e.g. https://api-inference.huggingface.co/models/google/flan-t5-base
_FREE_LLM_TOKEN = os.getenv("FREE_LLM_API_TOKEN")      # optional Bearer token for the service

# OpenRouter configuration – optional fallback to OpenRouter free models
_OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
_OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
_OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1")

_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "5"))  # increased default
_BACKOFF_FACTOR = float(os.getenv("GEMINI_BACKOFF_FACTOR", "3"))  # increased default

MODELS = {
    "flash": "gemini-flash-latest",
    "pro":   "gemini-pro-latest",
}

# Rate-limit info (approximate, as the Python SDK does not expose headers)
RATE_LIMITS = {
    "flash": {
        "rpm":         15,
        "rpd":      1_500,
        "tpm":    1_000_000,
        "reset_note": "Quota resets every 24 h (day quota) and every 1 min (per-minute quota).",
    },
    "pro": {
        "rpm":          2,
        "rpd":         50,
        "tpm":     32_000,
        "reset_note": "Quota resets every 24 h (day quota) and every 1 min (per-minute quota).",
    },
}

if _API_KEY:
    genai.configure(api_key=_API_KEY)

# ---------------------------------------------------------------------------
# In-memory TTL cache  {cache_key -> {ts: float, data: dict}}
# ---------------------------------------------------------------------------
_cache: Dict[str, Dict[str, Any]] = {}


def _make_key(prompt: str, model_alias: str) -> str:
    # Cache key is based solely on the prompt to reuse results across models
    return f"{hash(prompt)}"


def _get_cached(prompt: str, model_alias: str) -> Optional[Dict]:
    key = _make_key(prompt, model_alias)
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        logger.info("Gemini cache hit for model=%s", model_alias)
        return entry["data"]
    return None


def _set_cached(prompt: str, model_alias: str, data: Dict) -> None:
    key = _make_key(prompt, model_alias)
    _cache[key] = {"ts": time.time(), "data": data}


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------
def build_recommendation_prompt(
    scan_results: Dict,
    modules: list,
    domain_info: Dict,
    score_info: Dict,
) -> str:
    return f"""You are an expert SaaS product strategist. Analyse the following codebase scan and return a structured JSON recommendation.

## Codebase Snapshot
- Domain: {domain_info.get('domain', 'Unknown')} ({domain_info.get('confidence', 0)}% confidence)
- Files: {scan_results.get('file_count', 0)} | Folders: {scan_results.get('folder_count', 0)}
- Languages: {json.dumps(scan_results.get('languages', {}))}
- Detected Modules: {json.dumps([m.get('name') for m in modules])}
- Overall Product Score: {score_info.get('overall_score', 50)}/100

## Required JSON Output Schema
{{
  "recommended_product": "<creative product name>",
  "product_type": "<SaaS Product|API Product|Enterprise Software|Internal Developer Tool>",
  "explanation": "<2-3 sentences explaining the recommendation>",
  "can_become_product": "<YES|NO>",
  "roadmap": ["<step 1>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"],
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>", "<reason 4>"],
  "ai_insights": {{
    "market_opportunity": "<1 sentence on market gap this fills>",
    "monetization_model": "<Freemium|Subscription|Usage-based|Enterprise License>",
    "estimated_tam": "<rough target addressable market>",
    "competitive_edge": "<what differentiates this>",
    "time_to_market": "<estimated months to MVP>"
  }}
}}

Return ONLY valid JSON. No markdown, no explanation text outside the JSON."""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_ai_recommendation(
    scan_results: Dict,
    modules: list,
    domain_info: Dict,
    score_info: Dict,
    model_alias: str = "flash",
) -> Dict[str, Any]:
    """
    Call Gemini and return a structured SaaS recommendation.
    Falls back to an error dict if the API key is missing or request fails.
    """
    # -------------------------------------------------------------------
    # Decide which backend to use – priority: OpenRouter > Free‑LLM > Gemini
    # -------------------------------------------------------------------
    if _OPENROUTER_API_KEY:
        # Build the prompt (same for all backends)
        prompt = build_recommendation_prompt(scan_results, modules, domain_info, score_info)
        # Cache lookup for OpenRouter
        cached = _get_cached(prompt, "openrouter")
        if cached:
            return {**cached, "cached": True}
        try:
            client = OpenAI(base_url=_OPENROUTER_URL, api_key=_OPENROUTER_API_KEY)
            response = client.chat.completions.create(
                model=_OPENROUTER_MODEL,
                messages=[{"role": "user", "content": prompt}],
                extra_body={"reasoning": {"enabled": True}},
                stream=False,
            )
            content = response.choices[0].message.content
            # Extract JSON from response
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            json_str = content[start_idx:end_idx + 1] if start_idx != -1 and end_idx != -1 else content
            data = json.loads(json_str)
            data["source"] = "openrouter"
            data["model"] = _OPENROUTER_MODEL
            data["cached"] = False
            _set_cached(prompt, "openrouter", data)
            return data
        except json.JSONDecodeError as e:
            logger.error("OpenRouter returned non‑JSON response: %s", e)
            snippet = content[:200] if "content" in locals() else "Empty response"
            return {"error": f"OpenRouter non‑JSON response: {snippet}", "source": "openrouter"}
        except Exception as e:
            logger.error("OpenRouter API call failed: %s", e)
            return {"error": str(e), "source": "openrouter"}
    # If a free‑LLM endpoint is configured, prefer it (no quota limits on Gemini)
    if _FREE_LLM_URL:
        # Build the prompt first (same prompt works for both services)
        prompt = build_recommendation_prompt(scan_results, modules, domain_info, score_info)
        # Check cache before calling the free service
        cached = _get_cached(prompt, model_alias)
        if cached:
            return {**cached, "cached": True}
        try:
            headers = {}
            if _FREE_LLM_TOKEN:
                headers["Authorization"] = f"Bearer {_FREE_LLM_TOKEN}"
            # Most free inference APIs expect a JSON payload with a "inputs" field
            payload = {"inputs": prompt}
            response = requests.post(_FREE_LLM_URL, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            raw_text = response.json()
            # Some services return a list of generated strings; normalize to a string
            if isinstance(raw_text, list) and raw_text:
                raw_text = raw_text[0]
            if isinstance(raw_text, dict) and "generated_text" in raw_text:
                raw_text = raw_text["generated_text"]
            # The model should return JSON inside the generated text – reuse existing extraction logic
            start_idx = raw_text.find('{')
            end_idx = raw_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                raw_text = raw_text[start_idx:end_idx + 1]
            data = json.loads(raw_text)
            data["source"] = "free_llm"
            data["model"] = "free"
            data["cached"] = False
            _set_cached(prompt, model_alias, data)
            return data
        except json.JSONDecodeError as e:
            logger.error("Free LLM returned non‑JSON response: %s", e)
            snippet = raw_text[:200] if "raw_text" in locals() else "Empty response"
            return {"error": f"Free LLM returned non‑JSON response: {snippet}", "source": "free_llm"}
        except Exception as e:
            logger.error("Free LLM API call failed: %s", e)
            return {"error": str(e), "source": "free_llm"}
    # -------------------------------------------------------------------
    # Fallback to Gemini (original behaviour)
    # -------------------------------------------------------------------
    if not _API_KEY:
        return {"error": "GEMINI_API_KEY not configured on the server.", "source": "ai"}

    model_name = MODELS.get(model_alias, MODELS["flash"])
    prompt = build_recommendation_prompt(scan_results, modules, domain_info, score_info)

    # Cache check
    cached = _get_cached(prompt, model_alias)
    if cached:
        return {**cached, "cached": True}
    cached = _get_cached(prompt, model_alias)
    if cached:
        return {**cached, "cached": True}

    attempt = 0
    while attempt <= _MAX_RETRIES:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "max_output_tokens": 1500,
                },
            )
            response = model.generate_content(prompt)
            raw_text = response.text.strip()

            # Find and extract the JSON block substring dynamically
            start_idx = raw_text.find('{')
            end_idx = raw_text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                raw_text = raw_text[start_idx:end_idx + 1]

            data = json.loads(raw_text)
            data["source"] = "ai"
            data["model"] = model_name
            data["cached"] = False

            _set_cached(prompt, model_alias, data)
            return data
        except json.JSONDecodeError as e:
            logger.error("Gemini returned non-JSON response: %s", e)
            snippet = raw_text[:200] if "raw_text" in locals() else "Empty response"
            return {"error": f"AI returned non-JSON response: {snippet}", "source": "ai"}
        except Exception as e:
            logger.error("Gemini API call failed on attempt %d: %s", attempt + 1, e)
            if attempt < _MAX_RETRIES:
                backoff = _BACKOFF_FACTOR ** attempt
                logger.info("Retrying after %s seconds...", backoff)
                time.sleep(backoff)
                attempt += 1
                continue
            return {"error": str(e), "source": "ai"}


def get_rate_limit_info(model_alias: str = "flash") -> Dict[str, Any]:
    """Return approximate rate-limit info for the selected model."""
    return RATE_LIMITS.get(model_alias, RATE_LIMITS["flash"])
