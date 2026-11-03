from typing import List
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PropTech Commercial Asset Management API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "proptech-super-secret-key-change-in-production-2026"
    WEBHOOK_HMAC_SECRET: str = "proptech-webhook-hmac-secret-2026"

    # Login users: "usuario:contraseña:rol;otro:clave:rol" (rol = comercial|proyectos|admin).
    # Empty means nobody can sign in; set it as a secret env var in Render.
    AUTH_USERS: str = ""
    ACCESS_TOKEN_EXPIRE_HOURS: int = 12
    
    # Dual database support: PostgreSQL in production (e.g. a Neon connection string such
    # as "postgresql://user:pass@host/db?sslmode=require"), SQLite fallback for local dev.
    # Drivers are picked automatically; see async_database_url / sync_database_url.
    DATABASE_URL: str = "sqlite+aiosqlite:///./proptech.db"
    SYNC_DATABASE_URL: str = ""

    # CORS: explicit origins (override with a JSON list in the env var) plus a
    # regex covering Vercel / Render preview and production domains.
    # A bare "*" is not allowed because the middleware sends credentials.
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    BACKEND_CORS_ORIGIN_REGEX: str = r"https://[a-z0-9-]+\.(vercel\.app|onrender\.com)"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def async_database_url(self) -> str:
        """DATABASE_URL with the asyncpg / aiosqlite driver and without libpq-only params."""
        if self.is_sqlite:
            return self.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://", 1) \
                if "+aiosqlite" not in self.DATABASE_URL else self.DATABASE_URL
        parts = urlsplit(_postgres_base(self.DATABASE_URL))
        # asyncpg rejects libpq options such as sslmode / channel_binding; SSL is
        # passed through connect_args instead (see database_requires_ssl).
        query = [(k, v) for k, v in parse_qsl(parts.query) if k not in _LIBPQ_ONLY_PARAMS]
        return urlunsplit(parts._replace(scheme="postgresql+asyncpg", query=urlencode(query)))

    @property
    def sync_database_url(self) -> str:
        if self.SYNC_DATABASE_URL:
            return self.SYNC_DATABASE_URL
        if self.is_sqlite:
            return self.DATABASE_URL.replace("+aiosqlite", "", 1)
        parts = urlsplit(_postgres_base(self.DATABASE_URL))
        return urlunsplit(parts._replace(scheme="postgresql+psycopg2"))

    @property
    def database_requires_ssl(self) -> bool:
        if self.is_sqlite:
            return False
        sslmode = dict(parse_qsl(urlsplit(self.DATABASE_URL).query)).get("sslmode", "")
        return sslmode in {"require", "verify-ca", "verify-full"}


_LIBPQ_ONLY_PARAMS = {"sslmode", "channel_binding", "sslrootcert", "sslcert", "sslkey"}


def _postgres_base(url: str) -> str:
    """Normalizes postgres:// and postgresql+driver:// prefixes to postgresql://."""
    scheme, sep, rest = url.partition("://")
    if scheme.split("+")[0] in {"postgres", "postgresql"}:
        return f"postgresql{sep}{rest}"
    return url


settings = Settings()
