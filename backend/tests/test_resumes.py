import io
import uuid

import pytest
from httpx import AsyncClient

from src.models.template import Template


@pytest.fixture
async def seed_template(db_session):
    """Seed a template so resume creation can reference it."""
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
    return template


SAMPLE_CONTENT = {
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
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "certifications": [],
}


@pytest.mark.asyncio
async def test_create_resume(client: AsyncClient, seed_template):
    response = await client.post(
        "/api/v1/resumes",
        json={
            "title": "My Resume",
            "template_id": str(seed_template.id),
            "content": SAMPLE_CONTENT,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "My Resume"
    assert body["data"]["is_default"] is True  # First resume is default


@pytest.mark.asyncio
async def test_list_resumes(client: AsyncClient, seed_template):
    # Create two resumes
    for title in ["Resume A", "Resume B"]:
        await client.post(
            "/api/v1/resumes",
            json={
                "title": title,
                "template_id": str(seed_template.id),
                "content": SAMPLE_CONTENT,
            },
        )

    response = await client.get("/api/v1/resumes")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2


@pytest.mark.asyncio
async def test_get_resume_by_id(client: AsyncClient, seed_template):
    # Create
    create_resp = await client.post(
        "/api/v1/resumes",
        json={
            "title": "Get Test",
            "template_id": str(seed_template.id),
            "content": SAMPLE_CONTENT,
        },
    )
    resume_id = create_resp.json()["data"]["id"]

    # Fetch
    response = await client.get(f"/api/v1/resumes/{resume_id}")
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Get Test"


@pytest.mark.asyncio
async def test_update_resume(client: AsyncClient, seed_template):
    create_resp = await client.post(
        "/api/v1/resumes",
        json={
            "title": "Before Update",
            "template_id": str(seed_template.id),
            "content": SAMPLE_CONTENT,
        },
    )
    resume_id = create_resp.json()["data"]["id"]

    response = await client.patch(
        f"/api/v1/resumes/{resume_id}",
        json={"title": "After Update"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "After Update"


@pytest.mark.asyncio
async def test_delete_resume(client: AsyncClient, seed_template):
    create_resp = await client.post(
        "/api/v1/resumes",
        json={
            "title": "To Delete",
            "template_id": str(seed_template.id),
            "content": SAMPLE_CONTENT,
        },
    )
    resume_id = create_resp.json()["data"]["id"]

    response = await client.delete(f"/api/v1/resumes/{resume_id}")
    assert response.status_code == 204

    # Verify gone
    get_resp = await client.get(f"/api/v1/resumes/{resume_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_resume(client: AsyncClient):
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/v1/resumes/{fake_id}")
    assert response.status_code == 404
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_extract_resume_rejects_invalid_type(client: AsyncClient):
    """Non-PDF/DOCX files should be rejected."""
    fake_file = io.BytesIO(b"not a pdf")
    response = await client.post(
        "/api/v1/resumes/extract",
        files={"file": ("test.txt", fake_file, "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["error"]


async def test_raw_upload_succeeds_with_existing_resumes(
    client: AsyncClient, seed_template
):
    """Regression: uploading a raw PDF must not crash when the user already has
    multiple resumes. The previous implementation used scalar_one_or_none() which
    raised MultipleResultsFound.
    """
    # Create two resumes so the "has any?" check has >1 row to scan.
    for title in ("First", "Second"):
        resp = await client.post(
            "/api/v1/resumes",
            json={
                "title": title,
                "template_id": str(seed_template.id),
                "content": SAMPLE_CONTENT,
            },
        )
        assert resp.status_code == 201

    pdf_bytes = b"%PDF-1.4 fake raw upload"
    response = await client.post(
        "/api/v1/resumes/raw-upload",
        data={"title": "Uploaded CV"},
        files={"file": ("cv.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    body = response.json()["data"]
    assert body["title"] == "Uploaded CV"
    assert body["is_raw_upload"] is True
    assert body["is_default"] is False  # already had two other resumes
    assert body["template_id"] is None
    assert body["content"] is None


async def test_raw_upload_becomes_default_when_first(
    client: AsyncClient, seed_template
):
    """When the user has no resumes yet, a raw upload is set as default."""
    pdf_bytes = b"%PDF-1.4 fake"
    response = await client.post(
        "/api/v1/resumes/raw-upload",
        data={"title": "Only CV"},
        files={"file": ("only.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    assert response.json()["data"]["is_default"] is True


async def test_raw_upload_rejects_non_pdf(client: AsyncClient, seed_template):
    """Only PDFs are accepted on the raw-upload endpoint."""
    response = await client.post(
        "/api/v1/resumes/raw-upload",
        data={"title": "bad"},
        files={"file": ("not.txt", io.BytesIO(b"text"), "text/plain")},
    )
    assert response.status_code == 400
