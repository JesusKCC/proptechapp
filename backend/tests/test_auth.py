from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.main import app


@pytest_asyncio.fixture(scope="function")
async def anon_client(db_session: AsyncSession, monkeypatch) -> AsyncGenerator[AsyncClient, None]:
    """Client without the admin override, so real authentication applies."""
    monkeypatch.setattr(settings, "AUTH_USERS", "ana:clave-ana:comercial;root:clave:root:admin")

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


async def login(client: AsyncClient, username: str, password: str):
    return await client.post("/api/v1/auth/login", json={"username": username, "password": password})


@pytest.mark.asyncio
async def test_api_requires_token(anon_client: AsyncClient):
    res = await anon_client.get("/api/v1/centros-comerciales/")
    assert res.status_code == 401

    res = await anon_client.get(
        "/api/v1/centros-comerciales/", headers={"Authorization": "Bearer forged.token"}
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(anon_client: AsyncClient):
    res = await login(anon_client, "ana", "incorrecta")
    assert res.status_code == 401
    res = await login(anon_client, "nadie", "clave-ana")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_grants_access_with_user_role(anon_client: AsyncClient, seeded_entities: dict):
    res = await login(anon_client, "Ana", "clave-ana")
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "ana" and data["role"] == "comercial"
    headers = {"Authorization": f"Bearer {data['access_token']}"}

    me = await anon_client.get("/api/v1/auth/me", headers=headers)
    assert me.json() == {"username": "ana", "role": "comercial"}

    res = await anon_client.get("/api/v1/centros-comerciales/", headers=headers)
    assert res.status_code == 200

    # A comercial user cannot escalate by sending another role header
    res = await anon_client.post(
        "/api/v1/webhooks/test-dispatch", headers={**headers, "X-User-Role": "proyectos"}
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_password_may_contain_colons_and_admin_can_switch_role(anon_client: AsyncClient):
    res = await login(anon_client, "root", "clave:root")
    assert res.status_code == 200
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    res = await anon_client.post(
        "/api/v1/webhooks/test-dispatch", headers={**headers, "X-User-Role": "comercial"}
    )
    assert res.status_code == 403
    res = await anon_client.post(
        "/api/v1/webhooks/test-dispatch", headers={**headers, "X-User-Role": "proyectos"}
    )
    assert res.status_code == 200
