"""Tailoring service — API-side logic for the tailoring pipeline.

Handles credit debit, JD deduplication, task creation, and result retrieval.
The actual AI work happens in the worker via `src/agents/orchestrator.py`.
"""

import hashlib
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import cloud_tasks, firestore
from src.core.exceptions import ForbiddenError, NotFoundError
from src.models.job_description import JobDescription
from src.models.resume import UserResume
from src.models.tailored_version import TailoredVersion
from src.models.user import User

logger = logging.getLogger(__name__)


async def start(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    jd_text: str,
) -> dict[str, str]:
    """Start a tailoring job.

    1. Validate resume ownership
    2. Dedup JD by text hash
    3. Create tailored_versions row (pending)
    4. Create task doc
    5. Dispatch worker
    6. Return { taskId }
    """
    # 1. Validate resume exists and belongs to user
    result = await db.execute(
        select(UserResume).where(UserResume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise NotFoundError("Resume", str(resume_id))
    if resume.user_id != user.id:
        raise ForbiddenError()

    # 2. Hash JD text → find or create job_descriptions record
    jd_hash = hashlib.sha256(jd_text.strip().encode()).hexdigest()
    jd_result = await db.execute(
        select(JobDescription).where(
            JobDescription.user_id == user.id,
            JobDescription.raw_text_hash == jd_hash,
        )
    )
    jd = jd_result.scalar_one_or_none()

    if jd is None:
        jd = JobDescription(
            id=uuid.uuid4(),
            user_id=user.id,
            title="",
            company="",
            raw_text=jd_text.strip(),
            raw_text_hash=jd_hash,
        )
        db.add(jd)
        await db.flush()

    # 4. Create tailored_versions row
    version_id = uuid.uuid4()
    task_id = str(version_id)

    version = TailoredVersion(
        id=version_id,
        user_resume_id=resume_id,
        jd_id=jd.id,
        status="pending",
        credits_used=0,
    )
    db.add(version)
    await db.flush()

    # 5. Create Firestore task doc
    await firestore.create_task_doc(task_id, "pending")

    # 6. Enqueue Cloud Task
    await cloud_tasks.enqueue_task(
        url="/internal/tasks/run-tailoring",
        payload={
            "version_id": str(version_id),
            "resume_id": str(resume_id),
            "jd_id": str(jd.id),
            "user_id": str(user.id),
        },
        task_id=task_id,
    )

    return {"task_id": task_id}


async def get_status(task_id: str) -> dict:
    """Get task status from Firestore."""
    status = await firestore.get_task_status(task_id)
    if status is None:
        raise NotFoundError("Task", task_id)

    return {
        "task_id": task_id,
        "status": status.get("status", "unknown"),
        "current_step": status.get("currentStep", ""),
        "progress_pct": status.get("progressPct", 0),
    }


async def get_result(
    db: AsyncSession, user: User, task_id: str
) -> TailoredVersion:
    """Get completed tailoring result from Postgres. Cleans up Firestore doc."""
    version_id = uuid.UUID(task_id)

    result = await db.execute(
        select(TailoredVersion).where(TailoredVersion.id == version_id)
    )
    version = result.scalar_one_or_none()
    if version is None:
        raise NotFoundError("TailoredVersion", task_id)

    # Ownership check via resume
    resume_result = await db.execute(
        select(UserResume).where(UserResume.id == version.user_resume_id)
    )
    resume = resume_result.scalar_one_or_none()
    if resume is None or resume.user_id != user.id:
        raise ForbiddenError()

    # Cleanup Firestore doc after result retrieval
    await firestore.delete_task_doc(task_id)

    return version


async def list_versions(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID | None = None,
) -> list[TailoredVersion]:
    """List tailored versions for a user, optionally filtered by resume."""
    # Get all user's resume IDs
    resume_query = select(UserResume.id).where(UserResume.user_id == user.id)
    resume_result = await db.execute(resume_query)
    user_resume_ids = [row[0] for row in resume_result.all()]

    if not user_resume_ids:
        return []

    query = (
        select(TailoredVersion)
        .where(TailoredVersion.user_resume_id.in_(user_resume_ids))
        .order_by(TailoredVersion.created_at.desc())
    )

    if resume_id is not None:
        if resume_id not in user_resume_ids:
            raise ForbiddenError()
        query = (
            select(TailoredVersion)
            .where(TailoredVersion.user_resume_id == resume_id)
            .order_by(TailoredVersion.created_at.desc())
        )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_version_by_id(
    db: AsyncSession, user: User, version_id: uuid.UUID
) -> TailoredVersion:
    """Get a single tailored version with ownership check."""
    result = await db.execute(
        select(TailoredVersion).where(TailoredVersion.id == version_id)
    )
    version = result.scalar_one_or_none()
    if version is None:
        raise NotFoundError("TailoredVersion", str(version_id))

    # Ownership check via resume
    resume_result = await db.execute(
        select(UserResume).where(UserResume.id == version.user_resume_id)
    )
    resume = resume_result.scalar_one_or_none()
    if resume is None or resume.user_id != user.id:
        raise ForbiddenError()

    return version
