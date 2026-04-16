import asyncio
from sqlalchemy import text
from core.database import AsyncSessionLocal

async def check_columns():
    async with AsyncSessionLocal() as session:
        # Pega uma linha pra ver as colunas
        res = await session.execute(text("SELECT * FROM suzano_pagamento_integracao LIMIT 1"))
        print("Columns in suzano_pagamento_integracao:", res.keys())
        
        # Pega uma linha de pagamento_acao também
        res2 = await session.execute(text("SELECT * FROM pagamento_acao LIMIT 1"))
        print("Columns in pagamento_acao:", res2.keys())

if __name__ == "__main__":
    asyncio.run(check_columns())
