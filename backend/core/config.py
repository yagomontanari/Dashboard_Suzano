from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    METRICS_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/db_tradelinks"
    SUPABASE_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dashboard_app"
    FRONTEND_URL: str = "http://localhost:5173"
    
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
