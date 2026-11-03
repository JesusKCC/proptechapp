from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Official Peru territorial envelope
PERU_LAT_MIN = -18.5
PERU_LAT_MAX = 0.0
PERU_LON_MIN = -81.5
PERU_LON_MAX = -68.5


class CentroComercialBase(BaseModel):
    nombre: str
    slug: str
    direccion: str = ""
    departamento: str
    provincia: str = ""
    distrito: str = ""
    lat: float = Field(..., description="Latitud en EPSG:4326 dentro de Perú [-18.5, 0.0]")
    lon: float = Field(..., description="Longitud en EPSG:4326 dentro de Perú [-81.5, -68.5]")
    total_locales: int = 0
    superficie_total_m2: float = 0.0
    imagen_url: Optional[str] = None
    plano_url: Optional[str] = None

    @field_validator("lat")
    @classmethod
    def validate_peru_lat(cls, v: float) -> float:
        if v is not None and not (PERU_LAT_MIN <= v <= PERU_LAT_MAX):
            raise ValueError(
                f"Latitude {v} is outside official Peru territorial envelope [{PERU_LAT_MIN}, {PERU_LAT_MAX}]"
            )
        return v

    @field_validator("lon")
    @classmethod
    def validate_peru_lon(cls, v: float) -> float:
        if v is not None and not (PERU_LON_MIN <= v <= PERU_LON_MAX):
            raise ValueError(
                f"Longitude {v} is outside official Peru territorial envelope [{PERU_LON_MIN}, {PERU_LON_MAX}]"
            )
        return v


class CentroComercialCreate(CentroComercialBase):
    pass


class CentroComercialUpdate(BaseModel):
    nombre: Optional[str] = None
    slug: Optional[str] = None
    direccion: Optional[str] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    total_locales: Optional[int] = None
    superficie_total_m2: Optional[float] = None
    imagen_url: Optional[str] = None
    plano_url: Optional[str] = None

    @field_validator("lat")
    @classmethod
    def validate_peru_lat(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (PERU_LAT_MIN <= v <= PERU_LAT_MAX):
            raise ValueError(
                f"Latitude {v} is outside official Peru territorial envelope [{PERU_LAT_MIN}, {PERU_LAT_MAX}]"
            )
        return v

    @field_validator("lon")
    @classmethod
    def validate_peru_lon(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (PERU_LON_MIN <= v <= PERU_LON_MAX):
            raise ValueError(
                f"Longitude {v} is outside official Peru territorial envelope [{PERU_LON_MIN}, {PERU_LON_MAX}]"
            )
        return v


class CentroComercialResponse(CentroComercialBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# GeoJSON format models
class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [lon, lat]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
