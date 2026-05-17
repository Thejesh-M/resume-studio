"""Cover letter service — API-side: start task and fetch result."""

import hashlib
import json
import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import cloud_tasks, firestore
from src.core.exceptions import ForbiddenError, NotFoundError
from src.models.cover_letter import CoverLetter
from src.models.job_description import JobDescription
from src.models.resume import UserResume
from src.models.user import User

logger = logging.getLogger(__name__)


async def start(
    db: AsyncSession,
    user: User,
    resume_id: UUID,
    jd_text: str,
) -> str:
    """Create DB row + task doc and dispatch the cover-letter worker.

    Returns:
        task_id (str representation of the cover letter row's UUID).
    """
    # Validate resume ownership
    result = await db.execute(
        select(UserResume).where(UserResume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise NotFoundError("Resume not found")
    if resume.user_id != user.id:
        raise ForbiddenError("Access denied")

    # Dedup JD
    jd_hash = hashlib.sha256(jd_text.encode()).hexdigest()
    jd_result = await db.execute(
        select(JobDescription).where(
            JobDescription.user_id == user.id,
            JobDescription.raw_text_hash == jd_hash,
        )
    )
    jd = jd_result.scalar_one_or_none()
    if jd is None:
        jd = JobDescription(
            user_id=user.id,
            title="",
            company="",
            raw_text=jd_text,
            raw_text_hash=jd_hash,
        )
        db.add(jd)
        await db.flush()

    # Create cover letter row
    cover_letter = CoverLetter(
        user_id=user.id,
        resume_id=resume_id,
        jd_id=jd.id,
        status="pending",
        credits_used=0,
    )
    db.add(cover_letter)
    await db.flush()

    task_id = str(cover_letter.id)

    # Create task doc
    await firestore.create_task_doc(task_id, "pending")

    # Dispatch local worker
    await cloud_tasks.enqueue_task(
        url="/internal/tasks/run-cover-letter",
        payload={
            "cover_letter_id": task_id,
            "resume_id": str(resume_id),
            "jd_id": str(jd.id),
            "user_id": str(user.id),
        },
        task_id=task_id,
    )

    await db.commit()
    logger.info("Cover letter task enqueued: %s", task_id)
    return task_id


async def get_result(
    db: AsyncSession,
    user: User,
    task_id: str,
) -> CoverLetter:
    """Fetch completed cover letter from Postgres and clean up Firestore."""
    try:
        cl_id = UUID(task_id)
    except ValueError:
        raise NotFoundError("Invalid task ID")

    result = await db.execute(
        select(CoverLetter).where(CoverLetter.id == cl_id)
    )
    cover_letter = result.scalar_one_or_none()

    if cover_letter is None:
        raise NotFoundError("Cover letter not found")
    if cover_letter.user_id != user.id:
        raise ForbiddenError("Access denied")
    if cover_letter.status not in ("completed", "failed"):
        raise NotFoundError("Cover letter not yet ready")

    # Clean up Firestore doc now that the client has the result
    await firestore.delete_task_doc(task_id)

    return cover_letter


async def get_status(task_id: str, user: User, db: AsyncSession) -> dict:
    """Read task status from Firestore."""
    status_doc = await firestore.get_task_status(task_id)
    if status_doc is None:
        raise NotFoundError("Task not found")
    return status_doc


async def list_for_user(db: AsyncSession, user: User) -> list[CoverLetter]:
    result = await db.execute(
        select(CoverLetter)
        .where(CoverLetter.user_id == user.id)
        .order_by(CoverLetter.created_at.desc())
    )
    return list(result.scalars().all())


def format_content(cover_letter: CoverLetter) -> str | None:
    """Return the stored JSON content string (parsed by client)."""
    if cover_letter.content is None:
        return None
    # Attempt to validate it's valid JSON; return as-is
    try:
        json.loads(cover_letter.content)
        return cover_letter.content
    except json.JSONDecodeError:
        return None
