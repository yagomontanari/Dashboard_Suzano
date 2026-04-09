from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Engine para o banco da aplicação (Supabase - Usuários)
app_engine = create_async_engine(settings.SUPABASE_DATABASE_URL, echo=True)
AppSessionLocal = sessionmaker(
    app_engine, class_=AsyncSession, expire_on_commit=False
)

async def get_app_db():
    async with AppSessionLocal() as session:
        yield session
