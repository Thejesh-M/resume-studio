"""In-memory task status tracking for the local app.

Replaces the cloud Firestore-backed implementation. Status docs live in a
process-local dict — they survive for the lifetime of the server and are
discarded on restart, which is the expected behaviour for a local app.

The module keeps the original function names so callers (orchestrator,
internal tasks API) don't need to change.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

logger = logging.getLogger(__name__)

_store: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(UTC).isoformat()


async def create_task_doc(task_id: str, initial_status: str = "pending") -> None:
    _store[task_id] = {
        "status": initial_status,
        "currentStep": "Queued",
        "progressPct": 0,
        "createdAt": _now(),
        "updatedAt": _now(),
    }
    logger.debug("task created: %s", task_id)


async def update_task_status(task_id: str, stage: str, progress_pct: int) -> None:
    if task_id in _store:
        _store[task_id].update(
            status="processing",
            currentStep=stage,
            progressPct=progress_pct,
            updatedAt=_now(),
        )


async def mark_task_completed(task_id: str) -> None:
    if task_id in _store:
        _store[task_id].update(
            status="completed",
            currentStep="Done",
            progressPct=100,
            updatedAt=_now(),
            expireAt=(datetime.now(UTC) + timedelta(hours=24)).isoformat(),
        )


async def mark_task_failed(task_id: str, error_message: str) -> None:
    if task_id in _store:
        _store[task_id].update(
            status="failed",
            currentStep="Failed",
            error=error_message,
            updatedAt=_now(),
            expireAt=(datetime.now(UTC) + timedelta(hours=24)).isoformat(),
        )


async def get_task_status(task_id: str) -> dict | None:
    return _store.get(task_id)


async def delete_task_doc(task_id: str) -> None:
    _store.pop(task_id, None)
