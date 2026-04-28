from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
from typing import Any

class Settings(BaseSettings):
    METRICS_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/db_tradelinks"
    SUPABASE_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dashboard_app"
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Segurança
    SECRET_KEY: str = "suzanodashboardsecretkey" # DEVE ser alterado via env em prod
    CRON_SECRET: str | None = None
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173", 
        "http://localhost:3001",
        "https://dashboard-suzano.vercel.app",
        "https://staging-dashboard-suzano.vercel.app"
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    @model_validator(mode="before")
    @classmethod
    def check_staging_prefix(cls, data: Any) -> Any:
        # VERCEL_ENV é uma variável reservada do Vercel. 
        # Se estivermos em 'preview' (homologação), priorizamos variáveis com prefixo STAGING_
        if isinstance(data, dict) and data.get("VERCEL_ENV") == "preview":
            # Criamos uma cópia para iterar e modificar o original com segurança
            for key in list(data.keys()):
                if key.startswith("STAGING_"):
                    # Ex: STAGING_SUPABASE_DATABASE_URL -> SUPABASE_DATABASE_URL
                    original_key = key.replace("STAGING_", "")
                    data[original_key] = data[key]
        return data
    
    # Manter retrocompatibilidade se necessário
    DATABASE_URL: str | None = None

    # Configurações de E-mail (SMTP)
    SMTP_USER: str = "yago.montanari@gmail.com"
    SMTP_PASSWORD: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    EMAILS_FROM_NAME: str = "Portal Suzano Dashboard"
    EMAILS_FROM_EMAIL: str = "yago.montanari@gmail.com"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
