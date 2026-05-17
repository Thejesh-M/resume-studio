"""Local task dispatcher — drop-in replacement for the original Cloud Tasks helper.

In the SaaS version, ``enqueue_task`` would POST to a worker service via Google
Cloud Tasks. Locally there's no worker — the task target lives in the same
process, so we call the internal HTTP endpoint directly via ``httpx`` against
``settings.api_url``. This keeps the orchestration code unchanged while
removing the cloud dependency.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)


async def enqueue_task(
    url: str,
    payload: dict,
    task_id: str | None = None,
) -> str:
    """Fire-and-forget POST to the given internal URL.

    ``url`` is a path (e.g. ``/internal/tasks/run-tailoring``); it's resolved
    against the local API URL. Errors are logged but never raised — the caller
    has already returned the task_id to the user.
    """
    full_url = f"{settings.api_url}{url}"
    logger.info("local task: POST %s (task_id=%s)", full_url, task_id)

    async def _run() -> None:
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                resp = await client.post(full_url, json=payload)
                if resp.status_code >= 400:
                    logger.warning("local task %s returned %d", full_url, resp.status_code)
        except Exception as exc:  # noqa: BLE001
            logger.exception("local task %s failed: %s", full_url, exc)

    # Run in background — we don't await the response.
    asyncio.create_task(_run())
    return task_id or "local-task"
