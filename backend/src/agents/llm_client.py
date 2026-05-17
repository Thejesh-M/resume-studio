"""Thin backwards-compatible wrapper around ``src.core.llm``.

Existing agents call ``get_client().generate(system, prompt, response_format)``.
The new multi-provider abstraction lives in :mod:`src.core.llm`; this module
just delegates to it so we don't have to update every agent.
"""

from __future__ import annotations

from src.core.llm import get_llm


class LLMClient:
    async def generate(
        self,
        system: str,
        prompt: str,
        response_format: str = "json",
    ) -> str:
        return await get_llm().generate(system, prompt, response_format)


_singleton: LLMClient | None = None


def get_client() -> LLMClient:
    global _singleton
    if _singleton is None:
        _singleton = LLMClient()
    return _singleton
