import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv('/home/ya_rabelo/Documentos/DashboardSuzano/backend/.env')
sys.path.append('/home/ya_rabelo/Documentos/DashboardSuzano/backend')
from core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        q = text("""
    SELECT
       concat(cg.id_externo,' - ',cg.nom_extensao) as "Customer Group",
       cli.id_externo as "Código do Cliente",
       marca.nom_extensao as "Hierarquia Elegível (Marca)",
       STRING_AGG(DISTINCT TO_CHAR(s.dta_emissao, 'MM/YYYY'), ', ') as "Meses Faturados"
    FROM sellin s
    INNER JOIN cliente cli ON s.id_cliente = cli.id
    INNER JOIN cliente_extensao ce ON cli.id = ce.id_cliente
    INNER JOIN extensao cg ON ce.id_extensao = cg.id AND cg.id_nivel_extensao = 2
    INNER JOIN produto p ON s.id_produto = p.id
    INNER JOIN v_produto_extensao_recursiva vper ON p.id = vper.id_produto 
    INNER JOIN extensao marca ON vper.id_extensao = marca.id 
        AND marca.id_nivel_extensao = 8 
        AND marca.des_atributos @> '{"nomeLabel": "hierarquia1", "indiceLabel": 2}'
    WHERE s.tipo_doc_fat IN ('ZF2B', 'ZFCO')
      AND s.dta_emissao >= '2026-01-01'
      AND s.dta_emissao <= '2026-03-31'
      AND cg.id_externo = '0010015977'
      AND marca.nom_extensao = 'PHNEV'
    GROUP BY cg.id_externo, cg.nom_extensao, cli.id_externo, marca.nom_extensao;
        """)
        try:
            res = await db.execute(q)
            rows = [dict(r) for r in res.mappings().all()]
            for r in rows:
                print(r)
        except Exception as e:
            print('Error:', e)

asyncio.run(main())
