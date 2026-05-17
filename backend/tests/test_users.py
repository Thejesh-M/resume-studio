import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, test_user):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == test_user.email
    assert body["data"]["name"] == test_user.name


@pytest.mark.asyncio
async def test_update_me(client: AsyncClient):
    response = await client.patch(
        "/api/v1/users/me",
        json={"name": "Updated Name", "onboarding_completed": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["name"] == "Updated Name"
    assert body["data"]["onboarding_completed"] is True


@pytest.mark.asyncio
async def test_update_me_partial(client: AsyncClient, test_user):
    """Only provided fields should be updated."""
    response = await client.patch(
        "/api/v1/users/me",
        json={"name": "Just Name"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["name"] == "Just Name"
    # onboarding_completed should remain unchanged
    assert body["data"]["onboarding_completed"] == test_user.onboarding_completed
