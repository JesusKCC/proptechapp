import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    codigo_ticket: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    centro_comercial_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("centros_comerciales.id", ondelete="CASCADE"), nullable=False, index=True
    )
    local_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("locales.id", ondelete="SET NULL"), nullable=True, index=True
    )
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="nuevo_requerimiento")
    estado: Mapped[str] = mapped_column(
        String(50), nullable=False, default="abierto", index=True
    )  # abierto, en_revision, resuelto, rechazado
    prioridad: Mapped[str] = mapped_column(
        String(50), nullable=False, default="media"
    )  # baja, media, alta, urgente
    creado_por: Mapped[str] = mapped_column(String(100), nullable=False, default="comercial")
    asignado_a: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notas_resolucion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resuelto_en: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    centro_comercial: Mapped["CentroComercial"] = relationship(
        "CentroComercial", back_populates="tickets"
    )
    local: Mapped[Optional["Local"]] = relationship(
        "Local", back_populates="tickets"
    )
