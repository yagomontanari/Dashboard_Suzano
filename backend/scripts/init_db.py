import asyncio
import sys
import os

# Adiciona o diretório backend ao path para importar core
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.database_app import app_engine
from core.models_app import Base

async def init_db():
    print("Conectando ao Supabase para criar tabelas...")
    async with app_engine.begin() as conn:
        # Cria as tabelas baseadas nos modelos definidos em models_app.py
        await conn.run_sync(Base.metadata.create_all)
    print("Tabelas criadas com sucesso no Supabase!")

if __name__ == "__main__":
    asyncio.run(init_db())
