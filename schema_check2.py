import urllib.parse

from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

engine = create_engine(os.getenv("DATABASE_URL").replace("postgresql+asyncpg", "postgresql"))

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orcamento';"))
    for row in res:
        print(dict(row))
