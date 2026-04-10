import asyncio
from sqlalchemy import text
from backend.core.database import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orcamento';
        """))
        for row in res:
            print(dict(row))

asyncio.run(check())
