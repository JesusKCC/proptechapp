import re
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import undefer
from app.core.security import require_comercial_or_proyectos
from app.db.session import get_db
from app.models.archivo_plano import ArchivoPlano

router = APIRouter()

MAX_PDF_BYTES = 25 * 1024 * 1024  # 25 MB


def archivo_path(archivo_id: str) -> str:
    """API-relative path (append to the /api/v1 base URL) that serves a stored PDF."""
    return f"/planos/archivos/{archivo_id}"


@router.post(
    "/upload",
    summary="Subir plano arquitectónico en PDF"
)
async def upload_blueprint(
    file: UploadFile = File(...),
    slug: str = Form("plano"),
    db: AsyncSession = Depends(get_db),
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
    archivo = ArchivoPlano(nombre_archivo=file_name, tamano_bytes=len(content), contenido=content)
    db.add(archivo)
    await db.commit()

    return {
        "success": True,
        "id": archivo.id,
        "path": archivo_path(archivo.id),
        "fileName": file_name,
        "sizeBytes": len(content),
    }


@router.get(
    "/archivos/{archivo_id}",
    summary="Descargar plano PDF (requiere sesión)",
    response_class=Response,
)
async def get_blueprint_file(
    archivo_id: str,
    db: AsyncSession = Depends(get_db),
    _role: str = Depends(require_comercial_or_proyectos)
):
    stmt = (
        select(ArchivoPlano)
        .options(undefer(ArchivoPlano.contenido))
        .where(ArchivoPlano.id == archivo_id)
        .execution_options(populate_existing=True)
    )
    archivo = (await db.execute(stmt)).scalar_one_or_none()
    if not archivo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plano no encontrado"
        )
    return Response(
        content=archivo.contenido,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{archivo.nombre_archivo}"',
            # Only the signed-in browser may keep a copy
            "Cache-Control": "private, max-age=3600",
        },
    )
