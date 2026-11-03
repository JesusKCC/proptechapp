import uuid
from typing import List, Optional
from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class CentroComercial(Base):
    __tablename__ = "centros_comerciales"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    direccion: Mapped[str] = mapped_column(Text, nullable=False, default="")
    departamento: Mapped[str] = mapped_column(String(100), nullable=False)
    provincia: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    distrito: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    total_locales: Mapped[int] = mapped_column(Integer, default=0)
    superficie_total_m2: Mapped[float] = mapped_column(Float, default=0.0)
    imagen_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # API path of the mall's main blueprint PDF (see ArchivoPlano)
    plano_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    planos: Mapped[List["PlanoCentro"]] = relationship(
        "PlanoCentro", back_populates="centro_comercial", cascade="all, delete-orphan"
    )
    locales: Mapped[List["Local"]] = relationship(
        "Local", back_populates="centro_comercial", cascade="all, delete-orphan"
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="centro_comercial", cascade="all, delete-orphan"
    )
