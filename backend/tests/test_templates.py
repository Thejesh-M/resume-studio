import uuid

import pytest
from httpx import AsyncClient

from src.models.template import Template


@pytest.fixture
async def seed_templates(db_session):
    """Seed two templates."""
    templates = [
        Template(
            id=uuid.uuid4(),
            name="Classic",
            category="classic",
            preview_url="https://example.com/classic.png",
            engine="typst",
            is_premium=False,
            is_ats_tested=True,
        ),
        Template(
            id=uuid.uuid4(),
            name="Modern Pro",
            category="modern",
            preview_url="https://example.com/modern.png",
            engine="typst",
            is_premium=True,
            is_ats_tested=True,
        ),
    ]
    for t in templates:
        db_session.add(t)
    await db_session.flush()
    return templates


@pytest.mark.asyncio
async def test_list_templates(client: AsyncClient, seed_templates):
    response = await client.get("/api/v1/templates")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2
    # Free templates should come first
    assert body["data"][0]["is_premium"] is False


@pytest.mark.asyncio
async def test_get_template_by_id(client: AsyncClient, seed_templates):
    template_id = str(seed_templates[0].id)
    response = await client.get(f"/api/v1/templates/{template_id}")
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Classic"


@pytest.mark.asyncio
async def test_get_nonexistent_template(client: AsyncClient):
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/v1/templates/{fake_id}")
    assert response.status_code == 404
    assert response.json()["success"] is False
