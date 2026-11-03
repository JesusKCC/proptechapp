import os
import re
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from app.core.config import settings
from app.core.security import require_comercial_or_proyectos

router = APIRouter()

MAX_PDF_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post(
    "/upload",
    summary="Subir plano arquitectónico en PDF"
)
async def upload_blueprint(
    request: Request,
    file: UploadFile = File(...),
    slug: str = Form("plano"),
    _role: str = Depends(require_comercial_or_proyectos)
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos en formato PDF"
        )

    content = await file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El plano PDF excede el tamaño máximo de 25 MB"
        )
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no es un PDF válido"
        )

    clean_slug = re.sub(r"[^a-z0-9_-]", "_", slug.lower())[:80] or "plano"
    file_name = f"{clean_slug}.pdf"
    os.makedirs(settings.BLUEPRINTS_DIR, exist_ok=True)
    with open(os.path.join(settings.BLUEPRINTS_DIR, file_name), "wb") as fh:
        fh.write(content)

    return {
        "success": True,
        "url": str(request.url_for("blueprints", path=file_name)),
        "fileName": file_name,
        "sizeBytes": len(content),
    }
