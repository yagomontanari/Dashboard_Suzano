import asyncio
import sys
from dotenv import load_dotenv
load_dotenv('/home/ya_rabelo/Documentos/DashboardSuzano/backend/.env')
sys.path.append('/home/ya_rabelo/Documentos/DashboardSuzano/backend')
from core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        q = text("SELECT * FROM sellin LIMIT 1;")
        try:
            res = await db.execute(q)
            print(res.keys())
        except Exception as e:
            print('Error:', e)

asyncio.run(main())
