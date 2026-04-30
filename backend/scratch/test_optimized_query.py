
import asyncio
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        # April 2026
        start_date = datetime(2026, 4, 1)
        end_date = datetime(2026, 4, 30, 23, 59, 59)
        
        query = text("""
            WITH pending_zajus AS (
                SELECT 
                    sapmc.id,
                    o.descricao as orc_desc,
                    oli.descricao as linha_desc,
                    sapmc.cond_value,
                    sapmc.dta_criacao,
                    cg.id as id_cg,
                    marca.id as id_marca,
                    cg.id_externo as cod_cg,
                    cg.nom_extensao as nom_cg,
                    marca.nom_extensao as nom_marca
                FROM suzano_ajuste_provisao_memoria_calculo sapmc
                INNER JOIN orcamento o ON o.id = sapmc.id_orcamento
                INNER JOIN orcamento_linha_investimento oli ON oli.id = sapmc.id_linha_investimento
                INNER JOIN sellin s_orig ON sapmc.id_sellin = s_orig.id
                INNER JOIN cliente cli ON s_orig.id_cliente = cli.id
                INNER JOIN cliente_extensao ce ON cli.id = ce.id_cliente
                INNER JOIN extensao cg ON ce.id_extensao = cg.id AND cg.id_nivel_extensao = 2
                INNER JOIN v_produto_extensao_recursiva vper ON s_orig.id_produto = vper.id_produto 
                INNER JOIN extensao marca ON vper.id_extensao = marca.id 
                    AND marca.id_nivel_extensao = 8 
                    AND marca.des_atributos @> '{"nomeLabel": "hierarquia1", "indiceLabel": 2}'
                WHERE sapmc.status = 'PENDENTE_INTEGRACAO'
                  AND sapmc.purch_no_c IS NOT NULL
                  AND sapmc.dta_alteracao >= :start_date AND sapmc.dta_alteracao <= :end_date
            ),
            distinct_pairs AS (
                SELECT DISTINCT id_cg, id_marca FROM pending_zajus
            ),
            pairs_with_faturamento AS (
                SELECT DISTINCT 
                    dp.id_cg,
                    dp.id_marca
                FROM distinct_pairs dp
                INNER JOIN cliente_extensao ce ON ce.id_extensao = dp.id_cg
                INNER JOIN sellin s ON s.id_cliente = ce.id_cliente
                INNER JOIN v_produto_extensao_recursiva vper ON s.id_produto = vper.id_produto AND vper.id_extensao = dp.id_marca
                WHERE s.tipo_doc_fat IN ('ZF2B', 'ZFCO')
                  AND s.dta_emissao >= CAST(:start_date AS TIMESTAMP) - INTERVAL '3 months'
                  AND s.dta_emissao < CAST(:start_date AS TIMESTAMP)
                  AND s.valor_total > 0
            )
            SELECT 
                p.orc_desc as "Orcamento",
                p.linha_desc as "Linha de Investimento",
                concat(p.cod_cg, ' - ', p.nom_cg) as "Customer Group",
                p.nom_marca as "Marca",
                p.cond_value as "Valor Provisão",
                TO_CHAR(p.dta_criacao, 'DD/MM/YYYY') as "Data Criação",
                'Sem faturamento histórico no período (D-3)' as "Mensagem"
            FROM pending_zajus p
            LEFT JOIN pairs_with_faturamento f ON f.id_cg = p.id_cg AND f.id_marca = p.id_marca
            WHERE f.id_cg IS NULL
            LIMIT 10
        """)
        
        start_time = datetime.now()
        res = await session.execute(query, {"start_date": start_date, "end_date": end_date})
        rows = res.fetchall()
        end_time = datetime.now()
        
        print(f"Query took {end_time - start_time}")
        print(f"Found {len(rows)} records.")
        for row in rows:
            print(f"Row: {row}")

if __name__ == "__main__":
    asyncio.run(check())
