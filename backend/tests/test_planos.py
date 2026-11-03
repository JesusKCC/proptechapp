import os
import pytest
from httpx import AsyncClient
from app.core.config import settings


@pytest.mark.asyncio
async def test_upload_blueprint_pdf_saves_file_and_returns_static_url(client: AsyncClient):
    pdf_bytes = b"%PDF-1.4\n%test\n"
    res = await client.post(
        "/api/v1/planos/upload",
        files={"file": ("nivel.pdf", pdf_bytes, "application/pdf")},
        data={"slug": "Test Mall/../Nivel 1"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["fileName"] == "test_mall____nivel_1.pdf"
    assert body["url"].endswith("/static/blueprints/test_mall____nivel_1.pdf")

    saved = os.path.join(settings.BLUEPRINTS_DIR, body["fileName"])
    try:
        with open(saved, "rb") as fh:
            assert fh.read() == pdf_bytes
    finally:
        os.remove(saved)


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
