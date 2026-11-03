import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_blueprint_pdf_stores_it_and_serves_it_back(client: AsyncClient):
    pdf_bytes = b"%PDF-1.4\n%test\n"
    res = await client.post(
        "/api/v1/planos/upload",
        files={"file": ("nivel.pdf", pdf_bytes, "application/pdf")},
        data={"slug": "Test Mall/../Nivel 1"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["fileName"] == "test_mall____nivel_1.pdf"
    assert body["path"] == f"/planos/archivos/{body['id']}"

    res = await client.get(f"/api/v1{body['path']}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content == pdf_bytes


@pytest.mark.asyncio
async def test_get_missing_blueprint_returns_404(client: AsyncClient):
    res = await client.get("/api/v1/planos/archivos/no-existe")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_upload_blueprint_rejects_non_pdf(client: AsyncClient):
    res = await client.post(
        "/api/v1/planos/upload",
        files={"file": ("plano.pdf", b"not a pdf", "application/pdf")},
    )
    assert res.status_code == 400

    res = await client.post(
        "/api/v1/planos/upload",
        files={"file": ("plano.txt", b"%PDF-1.4", "text/plain")},
    )
    assert res.status_code == 400
