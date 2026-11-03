import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class EventoOutbox(Base):
    __tablename__ = "eventos_outbox"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    tipo_evento: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entidad_tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    entidad_id: Mapped[str] = mapped_column(String(36), nullable=False)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    estado: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pendiente", index=True
    )  # pendiente, publicado, fallido
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    procesado_en: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
