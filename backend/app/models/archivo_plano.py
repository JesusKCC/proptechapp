import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, deferred
from app.db.base import Base


class ArchivoPlano(Base):
    """
    Blueprint PDF stored in the database, so uploads survive redeploys of the free
    Render instance (its disk is wiped) and are only served to signed-in users.
    """
    __tablename__ = "archivos_plano"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tamano_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    # Deferred so listing metadata never loads the PDF bytes
    contenido: Mapped[bytes] = deferred(mapped_column(LargeBinary, nullable=False))
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
