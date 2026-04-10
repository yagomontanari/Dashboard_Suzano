import asyncio
from sqlalchemy import text
from core.database import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as session:
        tables = [
            ("sellin", "dta_criacao"),
            ("cliente", "dta_criacao"),
            ("produto", "dta_criacao"),
            ("usuario", "dta_criacao"),
            ("suzano_ajuste_provisao_memoria_calculo", "dta_criacao"),
            ("suzano_pagamento_integracao", "dta_criacao"),
            ("suzano_orcamento_integracao", "valid_from")
        ]
        
        for table, col in tables:
            try:
                res = await session.execute(text(f"SELECT MAX({col}) FROM {table}"))
                print(f"{table}: {res.scalar()}")
            except Exception as e:
                print(f"{table}: ERROR ({e})")

if __name__ == "__main__":
    asyncio.run(check())
