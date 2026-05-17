"""Internal worker endpoints — called by Cloud Tasks, not by clients.

These endpoints handle the actual AI processing work.
In production, they run on a separate Cloud Run service with higher memory.
"""

import logging
import uuid

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from src.agents import cover_letter_agent, jd_analyzer, orchestrator
from src.core import firestore, storage
from src.core.database import async_session
from src.models.cover_letter import CoverLetter
from src.models.job_description import JobDescription
from src.models.resume import UserResume
from src.models.tailored_version import TailoredVersion
from src.models.template import Template

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/tasks", tags=["internal"])


class RunTailoringPayload(BaseModel):
    version_id: str
    resume_id: str
    jd_id: str
    user_id: str


@router.post("/run-tailoring")
async def run_tailoring(payload: RunTailoringPayload) -> dict:
    """Execute the tailoring pipeline.

    Called by Cloud Tasks. Steps:
    1. Idempotency check — if already completed, return 200
    2. Set status to processing
    3. Run AI orchestrator pipeline
    4. Upload results to GCS
    5. Update tailored_versions row
    6. Mark Firestore task completed
    7. On failure: mark failed, refund credit
    """
    version_id = uuid.UUID(payload.version_id)
    task_id = payload.version_id

    async with async_session() as db:
        try:
            # 1. Idempotency check
            result = await db.execute(
                select(TailoredVersion).where(TailoredVersion.id == version_id)
            )
            version = result.scalar_one_or_none()
            if version is None:
                logger.error("Tailored version not found: %s", version_id)
                return {"status": "error", "message": "Version not found"}

            if version.status == "completed":
                logger.info("Task %s already completed, skipping", task_id)
                return {"status": "already_completed"}

            # 2. Set status to processing
            version.status = "processing"
            db.add(version)
            await db.flush()

            # Load resume and JD
            resume_result = await db.execute(
                select(UserResume).where(
                    UserResume.id == uuid.UUID(payload.resume_id)
                )
            )
            resume = resume_result.scalar_one()

            jd_result = await db.execute(
                select(JobDescription).where(
                    JobDescription.id == uuid.UUID(payload.jd_id)
                )
            )
            jd = jd_result.scalar_one()

            # Get template category for compilation
            template_result = await db.execute(
                select(Template).where(Template.id == resume.template_id)
            )
            template = template_result.scalar_one_or_none()
            template_category = template.category if template else "classic"

            # 3. Run AI pipeline
            pipeline_result = await orchestrator.run_pipeline(
                task_id=task_id,
                resume_content=resume.content,
                jd_text=jd.raw_text,
                template_id=template_category,
            )

            # 4. Upload results to GCS
            user_id = payload.user_id
            vid = str(version_id)

            source_url = None
            pdf_url = None

            if pipeline_result["typst_source"]:
                source_path = storage.make_tailored_path(
                    user_id, vid, "tailored.typ"
                )
                await storage.upload_bytes(
                    source_path,
                    pipeline_result["typst_source"].encode(),
                    "text/plain",
                )
                source_url = source_path

            if pipeline_result["pdf_bytes"]:
                pdf_path = storage.make_tailored_path(
                    user_id, vid, "tailored.pdf"
                )
                await storage.upload_bytes(
                    pdf_path,
                    pipeline_result["pdf_bytes"],
                    "application/pdf",
                )
                pdf_url = pdf_path

            # 5. Update tailored_versions
            version.status = "completed"
            version.tailored_content = pipeline_result["tailored_content"]
            version.source_url = source_url
            version.pdf_url = pdf_url
            version.score_before = pipeline_result["score_before"]
            version.score_after = pipeline_result["score_after"]
            version.diff = pipeline_result["diff"]
            db.add(version)

            # Update JD with agent analysis if not already set
            if jd.agent_analysis is None:
                jd.agent_analysis = pipeline_result["jd_analysis"]
                db.add(jd)

            await db.commit()

            # 6. Mark Firestore task completed
            await firestore.mark_task_completed(task_id)

            logger.info(
                "Tailoring completed: %s (score: %.0f → %.0f)",
                task_id,
                pipeline_result["score_before"],
                pipeline_result["score_after"],
            )
            return {"status": "completed"}

        except Exception:
            logger.exception("Tailoring failed for task %s", task_id)

            # Mark failed in Firestore
            await firestore.mark_task_failed(task_id, "Processing failed")

            # Update version status
            try:
                version.status = "failed"
                db.add(version)
                await db.commit()
            except Exception:
                logger.exception("Failed to mark version failed: %s", task_id)
                await db.rollback()

            return {"status": "failed"}


# ---------------------------------------------------------------------------
# Cover Letter Worker
# ---------------------------------------------------------------------------


class RunCoverLetterPayload(BaseModel):
    cover_letter_id: str
    resume_id: str
    jd_id: str
    user_id: str


@router.post("/run-cover-letter")
async def run_cover_letter(payload: RunCoverLetterPayload) -> dict:
    """Execute cover letter generation.

    Called by Cloud Tasks. Steps:
    1. Idempotency check
    2. Set status to processing
    3. Run jd_analyzer + cover_letter_agent
    4. Store result in Postgres
    5. Mark Firestore task completed
    6. On failure: refund credit, mark failed
    """
    cl_id = uuid.UUID(payload.cover_letter_id)
    task_id = payload.cover_letter_id

    async with async_session() as db:
        try:
            # 1. Idempotency check
            result = await db.execute(
                select(CoverLetter).where(CoverLetter.id == cl_id)
            )
            cover_letter = result.scalar_one_or_none()
            if cover_letter is None:
                logger.error("CoverLetter not found: %s", cl_id)
                return {"status": "error", "message": "Cover letter not found"}

            if cover_letter.status == "completed":
                logger.info("Cover letter %s already completed, skipping", task_id)
                return {"status": "already_completed"}

            # 2. Set status to processing
            cover_letter.status = "processing"
            db.add(cover_letter)
            await db.flush()

            # Load resume and JD
            resume_result = await db.execute(
                select(UserResume).where(
                    UserResume.id == uuid.UUID(payload.resume_id)
                )
            )
            resume = resume_result.scalar_one()

            jd_result = await db.execute(
                select(JobDescription).where(
                    JobDescription.id == uuid.UUID(payload.jd_id)
                )
            )
            jd = jd_result.scalar_one()

            # 3. Run AI pipeline
            jd_analysis = await jd_analyzer.analyze_jd(jd.raw_text)
            cl_content = await cover_letter_agent.generate(
                resume_content=resume.content or {},
                jd_analysis=jd_analysis,
            )

            import json

            # Update JD analysis if not already set
            if jd.agent_analysis is None:
                jd.agent_analysis = jd_analysis
                db.add(jd)

            # 4. Store result
            cover_letter.status = "completed"
            cover_letter.content = json.dumps(cl_content)
            db.add(cover_letter)
            await db.commit()

            # 5. Mark Firestore completed
            await firestore.mark_task_completed(task_id)

            logger.info("Cover letter completed: %s", task_id)
            return {"status": "completed"}

        except Exception:
            logger.exception("Cover letter failed for task %s", task_id)

            await firestore.mark_task_failed(task_id, "Processing failed")

            try:
                cover_letter.status = "failed"
                db.add(cover_letter)
                await db.commit()
            except Exception:
                logger.exception("Failed to mark cover letter failed: %s", task_id)
                await db.rollback()

            return {"status": "failed"}
