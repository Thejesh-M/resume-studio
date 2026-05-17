import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.resume import UserResume
from src.models.template import Template
from src.models.user import User
from src.services import tailoring_service


@pytest.fixture
async def seed_resume(db_session: AsyncSession, test_user: User):
    template = Template(
        id=uuid.uuid4(),
        name="Classic",
        category="classic",
        preview_url="https://example.com/classic.png",
        engine="typst",
        is_premium=False,
        is_ats_tested=True,
    )
    db_session.add(template)
    await db_session.flush()

    resume = UserResume(
        id=uuid.uuid4(),
        user_id=test_user.id,
        title="My Resume",
        template_id=template.id,
        content={
            "contact": {"name": "John Doe", "email": "john@example.com"},
            "summary": "Experienced engineer",
            "experience": [
                {
                    "company": "Acme",
                    "title": "Engineer",
                    "dates": "2020-2024",
                    "bullets": ["Built APIs", "Led team"],
                }
            ],
            "education": [
                {
                    "institution": "MIT",
                    "degree": "BS",
                    "field": "CS",
                    "dates": "2016-2020",
                }
            ],
            "skills": ["Python", "FastAPI"],
            "certifications": [],
        },
        is_default=True,
    )
    db_session.add(resume)
    await db_session.flush()
    return resume


SAMPLE_JD = """
Software Engineer at TechCorp.
Requirements: 3+ years Python, FastAPI, PostgreSQL.
Nice to have: Docker, Kubernetes.
Responsibilities: Build APIs, mentor juniors, design systems.
"""


@pytest.mark.asyncio
async def test_start_returns_task_id(
    db_session: AsyncSession, test_user: User, seed_resume: UserResume
) -> None:
    with (
        patch("src.core.firestore.create_task_doc", new_callable=AsyncMock),
        patch(
            "src.core.cloud_tasks.enqueue_task", new_callable=AsyncMock
        ) as mock_enqueue,
    ):
        result = await tailoring_service.start(
            db_session, test_user, seed_resume.id, SAMPLE_JD
        )

    assert "task_id" in result
    mock_enqueue.assert_called_once()


@pytest.mark.asyncio
async def test_start_wrong_resume(db_session: AsyncSession, test_user: User) -> None:
    fake_id = uuid.uuid4()
    with pytest.raises(Exception, match="not found"):
        await tailoring_service.start(db_session, test_user, fake_id, SAMPLE_JD)


@pytest.mark.asyncio
async def test_jd_deduplication(
    db_session: AsyncSession, test_user: User, seed_resume: UserResume
) -> None:
    with (
        patch("src.core.firestore.create_task_doc", new_callable=AsyncMock),
        patch("src.core.cloud_tasks.enqueue_task", new_callable=AsyncMock),
    ):
        result1 = await tailoring_service.start(
            db_session, test_user, seed_resume.id, SAMPLE_JD
        )
        result2 = await tailoring_service.start(
            db_session, test_user, seed_resume.id, SAMPLE_JD
        )

    assert result1["task_id"] != result2["task_id"]


@pytest.mark.asyncio
async def test_list_versions_empty(
    db_session: AsyncSession, test_user: User
) -> None:
    versions = await tailoring_service.list_versions(db_session, test_user)
    assert versions == []


@pytest.mark.asyncio
async def test_get_status_not_found() -> None:
    with (
        patch(
            "src.core.firestore.get_task_status",
            new_callable=AsyncMock,
            return_value=None,
        ),
        pytest.raises(Exception, match="not found"),
    ):
        await tailoring_service.get_status("nonexistent-task-id")
