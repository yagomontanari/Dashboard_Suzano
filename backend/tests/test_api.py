import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from core.security import verify_password

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_login_success(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_failure(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.asyncio
async def test_dashboard_unauthorized(async_client):
    response = await async_client.get("/api/data/dashboard")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_dashboard_authorized_fallback(async_client):
    # Obtem token
    login_resp = await async_client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]
    
    # Chama endpoint de dashboard com token
    response = await async_client.get(
        "/api/data/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "vk11" in data
    assert "zaju" in data
    assert "errors" in data
