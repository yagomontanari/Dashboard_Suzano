from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    METRICS_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/db_tradelinks"
    SUPABASE_DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/dashboard_app"
    
    # Manter retrocompatibilidade se necessário
    DATABASE_URL: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
