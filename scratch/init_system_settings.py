
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

os.environ["SUPABASE_DATABASE_URL"] = "postgresql+asyncpg://postgres.nzhpcxbymunbsewjisaz:wVu4QnMrRvt87QRG@aws-1-us-east-1.pooler.supabase.com:5432/postgres?ssl=require"

from backend.core.database_app import app_engine
from backend.core.models_app import Base, SystemSetting
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

async def init_settings():
    async with app_engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)
        print("Tabelas verificadas/criadas.")

    AppSessionLocal = sessionmaker(
        app_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with AppSessionLocal() as session:
        # Check if notifications_enabled exists
        result = await session.execute(select(SystemSetting).where(SystemSetting.key == "notifications_enabled"))
        setting = result.scalar_one_or_none()
        
        if not setting:
            setting = SystemSetting(
                key="notifications_enabled",
                value="true",
                description="Habilita ou desabilita o envio automático de notificações agendadas."
            )
            session.add(setting)
            await session.commit()
            print("Configuração 'notifications_enabled' criada com valor 'true'.")
        else:
            print(f"Configuração 'notifications_enabled' já existe: {setting.value}")

if __name__ == "__main__":
    asyncio.run(init_settings())
