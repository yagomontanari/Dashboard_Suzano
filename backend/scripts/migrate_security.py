import asyncio
import sys
import os
from sqlalchemy import text

# Adiciona o diretório backend ao path para importar core
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.database_app import app_engine

async def migrate():
    print("Iniciando migração de segurança no Supabase...")
    async with app_engine.begin() as conn:
        # 1. Adicionar colunas à tabela users
        print("Adicionando colunas de bloqueio e expiração...")
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()"))
        except Exception as e:
            print(f"Erro ao adicionar colunas: {e}")

        # 2. Criar tabela password_history
        print("Criando tabela password_history...")
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS password_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    hashed_password VARCHAR NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                )
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_password_history_id ON password_history (id)"))
        except Exception as e:
            print(f"Erro ao criar tabela: {e}")

    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(migrate())
