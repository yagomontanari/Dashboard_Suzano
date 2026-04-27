
import asyncio
from sqlalchemy import text
from core.database import AsyncSessionLocal

async def check_volume():
    async with AsyncSessionLocal() as s:
        try:
            r = await s.execute(text('SELECT COUNT(*) FROM integracao_fila_erros'))
            print(f'Volume IFE: {r.scalar()}')
            
            r = await s.execute(text('SELECT COUNT(*) FROM cliente'))
            print(f'Volume Clientes: {r.scalar()}')
            
            # Check indexes
            r = await s.execute(text("""
                SELECT
                    t.relname as table_name,
                    i.relname as index_name,
                    a.attname as column_name
                FROM
                    pg_class t,
                    pg_class i,
                    pg_index ix,
                    pg_attribute a
                WHERE
                    t.oid = ix.indrelid
                    AND i.oid = ix.indexrelid
                    AND a.attrelid = t.oid
                    AND a.attnum = ANY(ix.indkey)
                    AND t.relkind = 'r'
                    AND t.relname IN ('integracao_fila_erros', 'cliente', 'cliente_contato')
                ORDER BY
                    t.relname,
                    i.relname;
            """))
            print("\nIndexes:")
            for row in r.mappings().all():
                print(f"{row['table_name']}: {row['index_name']} ({row['column_name']})")
        except Exception as e:
            print(f"Erro: {e}")

if __name__ == "__main__":
    asyncio.run(check_volume())
