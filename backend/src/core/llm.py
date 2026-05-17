"""Multi-provider LLM abstraction.

Selects a provider based on ``settings.llm_provider``:

  - ``gemini``    → google-genai (Gemini)
  - ``openai``    → openai (gpt-4o / gpt-4o-mini / ...)
  - ``anthropic`` → anthropic (Claude)
  - ``ollama``    → ollama (any local model)
  - ``none``      → disables AI features (raises ``LLMUnavailable``)

All providers expose the same ``generate(system, prompt, response_format)``
async method and return raw text. Set ``response_format="json"`` when you want
the provider to return strict JSON.

The factory is intentionally tiny — provider SDKs are imported lazily so users
who pick (say) Ollama don't need ``openai`` installed.
"""

from __future__ import annotations

import logging
from typing import Protocol

from src.core.config import settings

logger = logging.getLogger(__name__)


class LLMUnavailable(RuntimeError):
    """Raised when an AI call is attempted but no provider is configured."""


class LLMProvider(Protocol):
    """Common interface every provider implements."""

    async def generate(
        self, system: str, prompt: str, response_format: str = "json"
    ) -> str: ...


# --- Providers ---------------------------------------------------------------


class _GeminiProvider:
    def __init__(self) -> None:
        from google import genai

        if not settings.gemini_api_key:
            raise LLMUnavailable("GEMINI_API_KEY is not set")
        self._genai = genai
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model = settings.gemini_model

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        from google.genai import types

        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type=(
                    "application/json" if response_format == "json" else "text/plain"
                ),
                temperature=0.3,
            ),
        )
        return resp.text


class _OpenAIProvider:
    def __init__(self) -> None:
        from openai import AsyncOpenAI

        if not settings.openai_api_key:
            raise LLMUnavailable("OPENAI_API_KEY is not set")
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            response_format=(
                {"type": "json_object"} if response_format == "json" else {"type": "text"}
            ),
        )
        return resp.choices[0].message.content or ""


class _AnthropicProvider:
    def __init__(self) -> None:
        from anthropic import AsyncAnthropic

        if not settings.anthropic_api_key:
            raise LLMUnavailable("ANTHROPIC_API_KEY is not set")
        self._client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        # Anthropic doesn't have a "response_format=json" toggle; we steer via the system prompt.
        sys_prompt = system
        if response_format == "json":
            sys_prompt += "\n\nRespond with ONLY valid JSON. No prose, no fences."
        msg = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=sys_prompt,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        # Anthropic returns a list of content blocks
        parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
        return "".join(parts)


class _OllamaProvider:
    def __init__(self) -> None:
        from ollama import AsyncClient

        self._client = AsyncClient(host=settings.ollama_host)
        self._model = settings.ollama_model

    async def generate(self, system: str, prompt: str, response_format: str = "json") -> str:
        resp = await self._client.chat(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            format="json" if response_format == "json" else "",
            options={"temperature": 0.3},
        )
        return resp["message"]["content"]


class _DisabledProvider:
    async def generate(self, *_args, **_kwargs) -> str:
        raise LLMUnavailable(
            "No LLM provider configured. Set LLM_PROVIDER and the matching API key in .env"
        )


# --- Factory -----------------------------------------------------------------


_PROVIDERS: dict[str, type] = {
    "gemini": _GeminiProvider,
    "openai": _OpenAIProvider,
    "anthropic": _AnthropicProvider,
    "ollama": _OllamaProvider,
    "none": _DisabledProvider,
}

_instance: LLMProvider | None = None


def get_llm() -> LLMProvider:
    """Return the configured LLM provider (lazily constructed, then cached)."""
    global _instance
    if _instance is not None:
        return _instance

    name = (settings.llm_provider or "none").lower()
    cls = _PROVIDERS.get(name)
    if cls is None:
        logger.warning("Unknown LLM_PROVIDER=%r; disabling AI features", name)
        cls = _DisabledProvider
    _instance = cls()
    logger.info("Using LLM provider: %s", name)
    return _instance


def reset_llm() -> None:
    """Drop the cached provider — useful in tests after settings change."""
    global _instance
    _instance = None
