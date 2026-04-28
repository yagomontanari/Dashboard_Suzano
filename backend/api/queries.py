from sqlalchemy import text

# Pagination and sorting constants
PAGINATION_SORT_SUFFIX = " ORDER BY dta_alteracao DESC LIMIT :limit OFFSET :offset;"

# Queries Agregadas para o Dashboard (Otimização de Performance)
QUERY_ORCAMENTO_INTEGRACAO_TOTAL = text("""
    SELECT 
        COALESCE(SUM(integrado), 0) as success,
        COALESCE(SUM(pendente_integracao), 0) as pending,
        COALESCE(SUM(erro), 0) as error
    FROM (
        SELECT 
            count(1) FILTER (WHERE soi.status = 'INTEGRADO') AS integrado,
            count(1) FILTER (WHERE soi.status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
            count(1) FILTER (WHERE soi.status = 'ERRO') AS erro
        FROM suzano_orcamento_integracao soi
        INNER JOIN orcamento o ON o.id = soi.id_orcamento
        WHERE TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') >= soi.valid_from 
          AND TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') <= soi.valid_to
        GROUP BY soi.id_orcamento
    ) as sub;
""")

QUERY_ZAJU_TOTAL = text("""
    SELECT 
        COALESCE(SUM(integrado), 0) as success,
        COALESCE(SUM(pendente_integracao), 0) as pending,
        COALESCE(SUM(erro), 0) as error,
        COALESCE(SUM(pendente_retorno), 0) as pending_return,
        COALESCE(SUM(total_zaju), 0) as total
    FROM (
        SELECT 
            COUNT(1) FILTER (WHERE status = 'INTEGRADO') AS integrado,
            COUNT(1) FILTER (WHERE status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
            COUNT(1) FILTER (WHERE status = 'ERRO') AS erro,
            COUNT(1) FILTER (WHERE status = 'PENDENTE_RETORNO') AS pendente_retorno,
            COUNT(1) AS total_zaju
        FROM suzano_ajuste_provisao_memoria_calculo
        WHERE cond_value != 0
          AND dta_alteracao >= :start_date AND dta_alteracao < :end_date
          AND status NOT IN ('PENDENTE_INTEGRACAO1', 'STATUS_INVALIDO', 'INVALIDO')
          AND purch_no_c IS NOT NULL
        GROUP BY purch_no_c
    ) as sub;
""")

QUERY_ZAJU_BY_TYPE = text("""
    SELECT 
        sapmc.purch_no_c as type,
        otv.descricao as category,
        COALESCE(COUNT(1) FILTER (WHERE sapmc.status = 'INTEGRADO'), 0) AS success,
        COALESCE(COUNT(1) FILTER (WHERE sapmc.status = 'PENDENTE_INTEGRACAO'), 0) AS pending,
        COALESCE(COUNT(1) FILTER (WHERE sapmc.status = 'ERRO'), 0) AS error,
        COALESCE(COUNT(1) FILTER (WHERE sapmc.status = 'PENDENTE_RETORNO'), 0) AS pending_return,
        COALESCE(COUNT(1) FILTER (WHERE sapmc.status = 'PENDENTE_RETORNO' AND sapmc.dta_alteracao <= CURRENT_DATE - INTERVAL '2 days'), 0) AS pending_return_critical,
        COALESCE(COUNT(1), 0) AS total
    FROM suzano_ajuste_provisao_memoria_calculo sapmc
    INNER JOIN orcamento o ON o.id = sapmc.id_orcamento
    INNER JOIN orcamento_tipo_verba otv ON o.id_tipo_verba = otv.id
    WHERE sapmc.cond_value != 0
      AND sapmc.dta_alteracao >= :start_date AND sapmc.dta_alteracao < :end_date
      AND sapmc.status NOT IN ('PENDENTE_INTEGRACAO1', 'STATUS_INVALIDO', 'INVALIDO')
      AND sapmc.purch_no_c IS NOT NULL
    GROUP BY sapmc.purch_no_c, otv.descricao
    ORDER BY category, total DESC;
""")

QUERY_PAGAMENTOS_TOTAL = text("""
    SELECT 
        COALESCE(SUM(integrado), 0) as success,
        COALESCE(SUM(pendente_integracao), 0) as pending,
        COALESCE(SUM(pendente_retorno), 0) as pending_return,
        COALESCE(SUM(erro), 0) as error,
        
        -- Valores Financeiros
        COALESCE(SUM(valor_integrado), 0) AS value_success,
        COALESCE(SUM(valor_pendente_integracao), 0) AS value_pending,
        COALESCE(SUM(valor_pendente_retorno), 0) AS value_pending_return,
        COALESCE(SUM(valor_erro), 0) AS value_error
    FROM (
        SELECT 
            COUNT(1) FILTER (WHERE spi.status = 'INTEGRADO') AS integrado,
            COUNT(1) FILTER (WHERE spi.status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
            COUNT(1) FILTER (WHERE spi.status = 'PENDENTE_RETORNO') AS pendente_retorno,
            COUNT(1) FILTER (WHERE spi.status = 'ERRO') AS erro,
            
            SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'INTEGRADO') AS valor_integrado,
            SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'PENDENTE_INTEGRACAO') AS valor_pendente_integracao,
            SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'PENDENTE_RETORNO') AS valor_pendente_retorno,
            SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'ERRO' AND pa.vlr_final IS NOT NULL) AS valor_erro
        FROM suzano_pagamento_integracao spi
        INNER JOIN pagamento_acao pa ON spi.id_pagamento = pa.id 
        WHERE spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
        GROUP BY spi.id_cliente
    ) as sub;
""")

QUERY_TOP_CLIENTES = text("""
    SELECT 
        c.id_externo AS id,
        c.nom_cliente AS nome,
        SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) AS valor,
        COUNT(1) AS qtd
    FROM suzano_pagamento_integracao spi
    INNER JOIN cliente c ON spi.id_cliente = c.id
    INNER JOIN pagamento_acao pa ON spi.id_pagamento = pa.id 
    WHERE spi.status = 'INTEGRADO'
      AND spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
    GROUP BY c.id_externo, c.nom_cliente
    ORDER BY valor DESC
    LIMIT 5;
""")

# Query unificada para evitar múltiplas chamadas simultâneas (Resolvendo excesso de conexões abertas)
QUERY_DASHBOARD_COUNTS_CONSOLIDATED = text("""
    SELECT
        (
            WITH de AS (
                SELECT ife.registro ->> 'numeroDocFiscal' as nro_documento, ife.registro ->> 'produtoId' as id_produto, ife.registro ->> 'clienteId' as id_cliente, ife.registro ->> 'tipoDocFat' as tipo_doc_fat,
                ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'numeroDocFiscal', ife.registro ->> 'produtoId' ORDER BY ife.dta_criacao DESC) as rn
                FROM integracao_fila_erros ife WHERE tipo = 'SELLIN' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
            )
            SELECT COUNT(DISTINCT de.nro_documento) FROM de 
            WHERE de.rn = 1 AND NOT EXISTS (
                SELECT 1 FROM sellin se 
                WHERE de.nro_documento ~ '^[0-9]+$' AND se.nro_documento = CAST(de.nro_documento AS BIGINT)
            )
        ) as sellin,
        
        (
            WITH de AS (
                SELECT ife.registro ->> 'codCliente' as cod_cliente, 
                ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'codCliente' ORDER BY ife.dta_criacao DESC) as rn
                FROM integracao_fila_erros ife WHERE ife.tipo = 'CLIENTE' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
            )
            SELECT COUNT(1) FROM de WHERE de.rn = 1 AND NOT EXISTS (SELECT 1 FROM cliente c WHERE c.id_externo = de.cod_cliente)
        ) as clientes,

        (
            WITH de AS (
                SELECT ife.registro ->> 'idExterno' as id_produto,
                ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'idExterno' ORDER BY ife.dta_criacao DESC) as rn
                FROM integracao_fila_erros ife WHERE tipo = 'PRODUTO' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
            )
            SELECT COUNT(1) FROM de WHERE de.rn = 1 AND NOT EXISTS (SELECT 1 FROM produto p WHERE p.id_externo = de.id_produto)
        ) as produtos,

        (
            WITH de AS (
                SELECT ife.registro ->> 'numeroDocFat' as nro_documento, ife.registro ->> 'cutoff' as cutoff,
                ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'numeroDocFat', ife.registro ->> 'cutoff' ORDER BY ife.dta_criacao DESC) as rn
                FROM integracao_fila_erros ife WHERE ife.tipo = 'CUTOFF' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
            )
            SELECT COUNT(1) FROM de WHERE de.rn = 1 AND NOT EXISTS (SELECT 1 FROM sellin s WHERE s.nro_documento = CAST(de.nro_documento AS INTEGER) AND s.cutoff = de.cutoff)
        ) as cutoff,

        (
            WITH de AS (
                SELECT ife.registro ->> 'matricula' as matricula,
                ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'matricula' ORDER BY ife.dta_criacao DESC) as rn
                FROM integracao_fila_erros ife WHERE ife.tipo = 'PRE_CADASTRO_USUARIO' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
            )
            SELECT COUNT(1) FROM de WHERE de.rn = 1 AND NOT EXISTS (SELECT 1 FROM usuario u WHERE u.matricula = de.matricula)
        ) as usuarios,

        (
            SELECT COUNT(DISTINCT spi.id_pagamento)
            FROM suzano_pagamento_integracao spi
            WHERE spi.status = 'ERRO' AND spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
        ) as pagamentos,

        (
            SELECT COUNT(DISTINCT soi.id_orcamento)
            FROM suzano_orcamento_integracao soi
            WHERE soi.status = 'ERRO' AND (TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') BETWEEN soi.valid_from AND soi.valid_to)
        ) as vk11
""")

QUERY_LAST_SYNC = text("""
    SELECT 
        'Inbound' as direcao, 
        tipo as categoria, 
        MAX(dt_recebimento) as dta, 
        MAX(lote)::text as lote 
    FROM integracao_requisicao 
    WHERE tipo IN ('PRE_CADASTRO_USUARIO', 'CLIENTE', 'PAGAMENTO_LIQUIDADO', 'CUTOFF', 'SELLIN', 'PRODUTO')
    GROUP BY tipo

    UNION ALL

    SELECT 
        'Outbound' as direcao, 
        tipo as categoria, 
        MAX(dta_requisicao) as dta, 
        NULL as lote
    FROM suzano_integracao_servico
    WHERE tipo IN ('ORCAMENTO', 'PAGAMENTO', 'DADOS_PROVISOES', 'AJUSTE_PROVISAO')
    GROUP BY tipo
    ORDER BY dta DESC
""")

# Consultas Detalhadas (Originais)
QUERY_ORCAMENTO_INTEGRACAO = text("""
    SELECT 
        soi.id_orcamento,
        o.descricao,
        count(1) FILTER (WHERE soi.status = 'INTEGRADO') AS integrado,
        count(1) FILTER (WHERE soi.status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
        count(1) FILTER (WHERE soi.status = 'ERRO') AS erro
    FROM suzano_orcamento_integracao soi
    INNER JOIN orcamento o ON o.id = soi.id_orcamento
    WHERE TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') >= soi.valid_from 
      AND TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') <= soi.valid_to
    GROUP BY soi.id_orcamento, o.descricao
    ORDER BY soi.id_orcamento DESC;
""")

QUERY_ZAJU = text("""
    SELECT 
        sapmc.id_orcamento,
        otv.descricao AS tipo_verba,
        o.descricao,
        sapmc.id_ajuste_verba,
        oav.tipo_ajuste,
        oav.dta_alteracao,
        sapmc.purch_no_c,
        COUNT(1) FILTER (WHERE sapmc.status = 'INTEGRADO') AS integrado,
        COUNT(1) FILTER (WHERE sapmc.status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
        COUNT(1) FILTER (WHERE sapmc.status = 'ERRO') AS erro,
        COUNT(1) FILTER (WHERE sapmc.status = 'PENDENTE_RETORNO') AS pendente_retorno,
        COUNT(sapmc.status IN ('INTEGRADO', 'PENDENTE_INTEGRACAO')) AS total_zaju
    FROM suzano_ajuste_provisao_memoria_calculo sapmc
    INNER JOIN orcamento o ON sapmc.id_orcamento = o.id
    LEFT JOIN orcamento_ajuste_verba oav ON sapmc.id_ajuste_verba = oav.id
    INNER JOIN orcamento_tipo_verba otv ON o.id_tipo_verba = otv.id
    WHERE sapmc.cond_value != 0
      AND sapmc.dta_alteracao >= :start_date AND sapmc.dta_alteracao < :end_date
      AND sapmc.status NOT IN ('PENDENTE_INTEGRACAO1', 'STATUS_INVALIDO', 'INVALIDO')
      AND sapmc.purch_no_c IS NOT NULL
    GROUP BY sapmc.id_orcamento, otv.descricao, o.descricao, sapmc.id_ajuste_verba, oav.tipo_ajuste, oav.dta_alteracao, sapmc.purch_no_c 
    ORDER BY sapmc.purch_no_c ASC;
""")

QUERY_PAGAMENTOS = text("""
    SELECT 
        c.id_externo AS id_cliente,
        c.nom_cliente,
        COUNT(1) FILTER (WHERE spi.status = 'INTEGRADO') AS integrado,
        COUNT(1) FILTER (WHERE spi.status = 'PENDENTE_INTEGRACAO') AS pendente_integracao,
        COUNT(1) FILTER (WHERE spi.status = 'PENDENTE_RETORNO') AS pendente_retorno,
        COUNT(1) FILTER (WHERE spi.status = 'ERRO') AS erro,
        COUNT(1) FILTER (WHERE spi.status IN ('INTEGRADO', 'PENDENTE_INTEGRACAO', 'PENDENTE_RETORNO', 'ERRO')) AS total_pagamentos,
        
        -- Valores Financeiros
        SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'INTEGRADO') AS valor_integrado,
        SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'PENDENTE_INTEGRACAO') AS valor_pendente_integracao,
        SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'PENDENTE_RETORNO') AS valor_pendente_retorno,
        SUM(CAST(REPLACE(pa.vlr_final::TEXT, ',', '.') AS NUMERIC(15, 2))) FILTER (WHERE spi.status = 'ERRO' AND pa.vlr_final IS NOT NULL) AS valor_erro
    FROM suzano_pagamento_integracao spi
    INNER JOIN cliente c ON spi.id_cliente = c.id
    INNER JOIN pagamento_acao pa ON spi.id_pagamento = pa.id 
    WHERE spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
    GROUP BY c.id_externo, c.nom_cliente;
""")

# ================================
# ERROS E INCONSISTÊNCIAS
# ================================

QUERY_ERRO_SELLIN = text(r"""
    WITH dados_extraidos AS (
        SELECT 
            ife.erros, 
            TO_CHAR(ife.dta_criacao, 'DD/MM/YY HH24:MI:SS') AS dta_criacao,
            CASE 
                WHEN (ife.registro ->> 'dataEmissao') ~ '^[0-9]{2,4}[-/][0-9]{2}[-/][0-9]{2,4}' THEN 
                    TO_CHAR(TO_DATE(REPLACE(REPLACE(ife.registro ->> 'dataEmissao', '/', '-'), ' 00:00:00', ''), 'DD-MM-YYYY'), 'DD/MM/YYYY')
                ELSE ife.registro ->> 'dataEmissao'
            END AS data_emissao,
            ife.registro ->> 'numeroNF' AS nro_nota_fiscal,
            ife.registro ->> 'clienteId' AS id_cliente,
            ife.registro ->> 'nomCliente' AS nom_cliente,
            (ife.registro ->> 'clienteId') || ' - ' || (ife.registro ->> 'nomCliente') AS cliente,
            ife.registro ->> 'numeroDocFiscal' AS nro_documento,
            ife.registro ->> 'itemDocumento' AS item_documento,
            ife.registro ->> 'produtoId' AS id_produto,
            ife.registro ->> 'nomProduto' AS nom_produto,
            ife.registro ->> 'unidadeMedida' AS unidade_medida,
            ife.registro ->> 'quantidade' AS quantidade,
            ife.registro ->> 'valorBruto' AS valor_total,
            ife.registro ->> 'valorLiquido' AS valor_liquido,
            ife.registro ->> 'dataVencimentoLiq' AS dta_venc_liq,
            ife.registro ->> 'tipoDocFat' AS tipo_doc_fat,
            ife.registro ->> 'referenciaFat' AS referencia_fat,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'numeroDocFiscal', ife.registro ->> 'produtoId' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife
        WHERE tipo = 'SELLIN' 
          AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    ),
    itens_inconsistentes AS (
        SELECT * FROM dados_extraidos de
        WHERE de.rn = 1 AND NOT EXISTS (
            SELECT 1 FROM sellin se 
            WHERE de.nro_documento ~ '^[0-9]+$' 
              AND se.nro_documento = CAST(de.nro_documento AS BIGINT)
        )
    )
    SELECT 
        erros, dta_criacao, data_emissao, nro_nota_fiscal, id_cliente, nom_cliente, cliente,
        nro_documento, item_documento, id_produto, nom_produto, unidade_medida,
        quantidade, valor_total, valor_liquido, dta_venc_liq, tipo_doc_fat,
        referencia_fat, dta_alteracao
    FROM (
        SELECT *,
               ROW_NUMBER() OVER(PARTITION BY nro_documento ORDER BY dta_alteracao DESC) as rn_nota
        FROM itens_inconsistentes
    ) AS final
    WHERE rn_nota = 1
""")

QUERY_ERRO_SELLIN_DETALHADO = text(r"""
    WITH dados_extraidos AS (
        SELECT 
            ife.erros, 
            TO_CHAR(ife.dta_criacao, 'DD/MM/YY HH24:MI:SS') AS dta_criacao,
            CASE 
                WHEN (ife.registro ->> 'dataEmissao') ~ '^[0-9]{2,4}[-/][0-9]{2}[-/][0-9]{2,4}' THEN 
                    TO_CHAR(TO_DATE(REPLACE(REPLACE(ife.registro ->> 'dataEmissao', '/', '-'), ' 00:00:00', ''), 'DD-MM-YYYY'), 'DD/MM/YYYY')
                ELSE ife.registro ->> 'dataEmissao'
            END AS data_emissao,
            ife.registro ->> 'numeroNF' AS nro_nota_fiscal,
            ife.registro ->> 'clienteId' AS id_cliente,
            ife.registro ->> 'nomCliente' AS nom_cliente,
            (ife.registro ->> 'clienteId') || ' - ' || (ife.registro ->> 'nomCliente') AS cliente,
            ife.registro ->> 'numeroDocFiscal' AS nro_documento,
            ife.registro ->> 'itemDocumento' AS item_documento,
            ife.registro ->> 'produtoId' AS id_produto,
            ife.registro ->> 'nomProduto' AS nom_produto,
            ife.registro ->> 'unidadeMedida' AS unidade_medida,
            ife.registro ->> 'quantidade' AS quantidade,
            ife.registro ->> 'valorBruto' AS valor_total,
            ife.registro ->> 'valorLiquido' AS valor_liquido,
            ife.registro ->> 'dataVencimentoLiq' AS dta_venc_liq,
            ife.registro ->> 'tipoDocFat' AS tipo_doc_fat,
            ife.registro ->> 'referenciaFat' AS referencia_fat,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'numeroDocFiscal', ife.registro ->> 'produtoId' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife
        WHERE tipo = 'SELLIN' 
          AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    )
    SELECT * FROM dados_extraidos de
    WHERE de.rn = 1 AND NOT EXISTS (
        SELECT 1 FROM sellin se 
        WHERE de.nro_documento ~ '^[0-9]+$' 
          AND se.nro_documento = CAST(de.nro_documento AS BIGINT)
    )
    ORDER BY nro_documento, item_documento;
""")

QUERY_ERRO_SELLIN_PAGINATED = text(QUERY_ERRO_SELLIN.text + PAGINATION_SORT_SUFFIX)


QUERY_ERRO_CLIENTES = text("""
    WITH dados_extraidos AS (
        SELECT 
            ife.erros, 
            TO_CHAR(ife.dta_criacao, 'DD/MM/YY HH24:MI:SS') AS dta_criacao,
            ife.registro ->> 'codCliente' AS cod_cliente,
            ife.registro ->> 'nome' AS nom_cliente,
            ife.registro ->> 'cnpj' AS cnpj,
            CAST(ife.registro ->> 'ativoInativo' AS BOOLEAN) AS ativo_inativo,
            ife.registro ->> 'descricaoContato' AS contato_cliente,
            ife.registro ->> 'emailContato' AS email_contato_cliente,
            ife.registro ->> 'telefoneContato' AS telefone_contato_cliente,
            CAST(ife.registro ->> 'pagador' AS BOOLEAN) AS sap_pagador,
            ife.registro ->> 'codCustomerGroup' AS cod_customer_group,
            ife.registro ->> 'customerGroup' AS customer_group,
            ife.registro ->> 'codCanal' AS cod_canal,
            ife.registro ->> 'canal' AS canal,
            ife.registro ->> 'subCanal' AS sub_canal,
            ife.registro ->> 'codRegional' AS cod_regional,
            ife.registro ->> 'divisaoRegional' AS regional,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'codCliente' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife
        WHERE ife.tipo = 'CLIENTE' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    )
    SELECT 
        de.dta_criacao, de.erros, de.cod_cliente, de.nom_cliente, de.cnpj,
        de.ativo_inativo, de.contato_cliente, de.email_contato_cliente, de.telefone_contato_cliente,
        de.sap_pagador, de.cod_customer_group, de.customer_group, de.cod_canal, de.canal, de.sub_canal,
        de.cod_regional, de.regional, de.dta_alteracao
    FROM dados_extraidos de
    WHERE de.rn = 1 AND NOT EXISTS (
        SELECT 1 FROM cliente c
        WHERE c.id_externo = de.cod_cliente
    )
""")

QUERY_ERRO_CLIENTES_PAGINATED = text(QUERY_ERRO_CLIENTES.text + PAGINATION_SORT_SUFFIX)


QUERY_ERRO_PRODUTOS = text("""
    WITH dados_extraidos AS (
        SELECT 
            ife.lote, ife.erros, ife.dta_criacao,
            ife.registro ->> 'idExterno' AS id_produto,
            ife.registro ->> 'nome' AS nom_produto,
            ife.registro ->> 'ativoInativo' AS ativo_inativo,
            ife.registro ->> 'volume' AS volume,
            ife.registro ->> 'peso' AS peso,
            ife.registro ->> 'unidadeMedida' AS unidade_medida,
            ife.registro ->> 'codClasse' AS cod_classe,
            ife.registro ->> 'classe' AS classe,
            ife.registro ->> 'codLinhaProduto' AS cod_linha_produto,
            ife.registro ->> 'grupoMercadoria' AS grupo_mercadoria,
            ife.registro ->> 'codFamilia' AS cod_familia,
            ife.registro ->> 'familia' AS familia,
            ife.registro ->> 'codSetorAtividade' AS cod_setor_atividade,
            ife.registro ->> 'setorAtividade' AS setor_atividade,
            ife.registro ->> 'codHierarquia1' AS cod_hierarquia1,
            ife.registro ->> 'hierarquia1' AS hierarquia1,
            ife.registro ->> 'codHierarquia2' AS cod_hierarquia2,
            ife.registro ->> 'hierarquia2' AS hierarquia2,
            ife.registro ->> 'codHierarquia3' AS cod_hierarquia3,
            ife.registro ->> 'hierarquia3' AS hierarquia3,
            ife.registro ->> 'codUnidadeNegocio' AS cod_unidade_negocio,
            ife.registro ->> 'unidadeNegocio' AS unidade_negocio,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'idExterno' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife 
        WHERE tipo = 'PRODUTO' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    )
    SELECT 
        de.lote, de.erros, de.id_produto, de.nom_produto, de.ativo_inativo,
        de.volume, de.peso, de.unidade_medida, de.cod_classe, de.classe,
        de.cod_linha_produto, de.grupo_mercadoria, de.cod_familia, de.familia,
        de.cod_setor_atividade, de.setor_atividade, de.cod_hierarquia1, de.hierarquia1,
        de.cod_hierarquia2, de.hierarquia2, de.cod_hierarquia3, de.hierarquia3,
        de.cod_unidade_negocio, de.unidade_negocio, de.dta_alteracao
    FROM dados_extraidos de
    WHERE de.rn = 1 AND NOT EXISTS (
        SELECT 1 FROM produto p WHERE p.id_externo = de.id_produto
    )
""")

QUERY_ERRO_PRODUTOS_PAGINATED = text(QUERY_ERRO_PRODUTOS.text + PAGINATION_SORT_SUFFIX)


QUERY_ERRO_CUTOFF = text("""
    WITH dados_extraidos AS (
        SELECT 
            ife.tipo, ife.erros, ife.dta_criacao, ife.lote,
            ife.registro ->> 'cutoff' AS cutoff,
            ife.registro ->> 'numeroDocFat' AS nro_documento,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'numeroDocFat', ife.registro ->> 'cutoff' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife 
        WHERE ife.tipo = 'CUTOFF' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    )
    SELECT de.tipo, de.erros, de.cutoff, de.nro_documento, de.dta_alteracao, de.lote
    FROM dados_extraidos de
    WHERE de.rn = 1 AND NOT EXISTS (
        SELECT 1 FROM sellin s 
        WHERE s.nro_documento = CAST(de.nro_documento AS INTEGER) 
          AND s.cutoff = de.cutoff
    )
""")

QUERY_ERRO_CUTOFF_PAGINATED = text(QUERY_ERRO_CUTOFF.text + PAGINATION_SORT_SUFFIX)


QUERY_ERRO_USUARIOS = text("""
    WITH dados_extraidos AS (
        SELECT 
            ife.erros, ife.dta_criacao, ife.lote,
            ife.registro ->> 'email' AS email,
            ife.registro ->> 'matricula' AS matricula,
            ife.registro ->> 'nomePerfil' AS nome_perfil,
            ife.registro ->> 'ativoInativo' AS ativo_inativo,
            ife.registro ->> 'nomeEstrutura' AS nome_estrutura,
            ife.registro ->> 'codigoDivisao' AS codigo_divisao,
            ife.registro ->> 'indRecebeEmail' AS ind_recebe_email,
            ife.registro ->> 'chaveIntegracao' AS chave_integracao,
            ife.registro ->> 'indAprovaWorkflow' AS ind_aprova_workflow,
            ife.dta_alteracao,
            ROW_NUMBER() OVER(PARTITION BY ife.registro ->> 'matricula' ORDER BY ife.dta_criacao DESC) as rn
        FROM integracao_fila_erros ife 
        WHERE ife.tipo = 'PRE_CADASTRO_USUARIO' AND ife.dta_alteracao >= :start_date AND ife.dta_alteracao < :end_date
    )
    SELECT 
        de.erros, de.dta_criacao, de.email, de.matricula, de.nome_perfil,
        de.ativo_inativo, de.nome_estrutura, de.codigo_divisao, de.ind_recebe_email,
        de.chave_integracao, de.ind_aprova_workflow, de.dta_alteracao, de.lote
    FROM dados_extraidos de
    WHERE de.rn = 1 AND NOT EXISTS (
        SELECT 1 FROM usuario u 
        WHERE u.matricula = de.matricula 
    )
""")

QUERY_ERRO_USUARIOS_PAGINATED = text(QUERY_ERRO_USUARIOS.text + PAGINATION_SORT_SUFFIX)

QUERY_ERRO_PAGAMENTOS_LIST = text("""
    WITH dados AS (
        SELECT 
            spi.id_pagamento as cod_pagamento,
            c.id_externo as cod_cliente,
            c.nom_cliente,
            concat(c.id_externo,' - ',c.nom_cliente) as cliente,
            spi.nro_documento,
            spi.sequencial,
            spi.doc_type,
            spi.purch_no_c,
            spi.cond_type,
            spi.tipo_acao,
            spi.dta_criacao,
            spi.dta_alteracao,
            spi.dta_integracao as dta_envio_integracao,
            spi.status,
            spi.msg,
            pa.vlr_final as valor_pagamento,
            ROW_NUMBER() OVER(PARTITION BY spi.id_pagamento ORDER BY spi.dta_alteracao DESC) as rn
        FROM suzano_pagamento_integracao spi
        INNER JOIN cliente c ON spi.id_cliente = c.id
        LEFT JOIN pagamento_acao pa ON spi.id_pagamento = pa.id
        WHERE spi.status = 'ERRO'
          AND spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
    )
    SELECT *
    FROM dados
    WHERE rn = 1
""")

QUERY_ERRO_PAGAMENTOS_LIST_PAGINATED = text(QUERY_ERRO_PAGAMENTOS_LIST.text + PAGINATION_SORT_SUFFIX)

QUERY_PAGAMENTOS_SUCESSO_LIST = text("""
    WITH dados AS (
        SELECT 
            spi.id_pagamento as cod_pagamento,
            c.id_externo as cod_cliente,
            c.nom_cliente,
            concat(c.id_externo,' - ',c.nom_cliente) as cliente,
            spi.sequencial,
            spi.purch_no_c,
            spi.dta_criacao,
            spi.dta_alteracao,
            spi.dta_integracao as dta_envio_integracao,
            spi.status,
            spi.msg,
            pa.vlr_final as valor_pagamento,
            ROW_NUMBER() OVER(PARTITION BY spi.id_pagamento ORDER BY spi.dta_alteracao DESC) as rn
        FROM suzano_pagamento_integracao spi
        INNER JOIN cliente c ON spi.id_cliente = c.id
        LEFT JOIN pagamento_acao pa ON spi.id_pagamento = pa.id
        WHERE spi.status = 'INTEGRADO'
          AND spi.dta_alteracao >= :start_date AND spi.dta_alteracao < :end_date
    )
    SELECT cod_pagamento, cod_cliente, nom_cliente, cliente, sequencial, purch_no_c, dta_criacao, dta_envio_integracao, status, msg, dta_alteracao, valor_pagamento
    FROM dados
    WHERE rn = 1
""")

QUERY_PAGAMENTOS_SUCESSO_LIST_PAGINATED = text(QUERY_PAGAMENTOS_SUCESSO_LIST.text + PAGINATION_SORT_SUFFIX)

QUERY_ERRO_VK11_LIST = text("""
    SELECT 
        soi.id_orcamento,
        o.descricao,
        soi.tipo_integracao,
        soi.id_ajuste_verba,
        soi.status,
        soi.msg,
        soi.valid_from,
        o.dta_alteracao as dta_alteracao
    FROM suzano_orcamento_integracao soi
    INNER JOIN orcamento o ON o.id = soi.id_orcamento
    WHERE soi.status = 'ERRO'
      AND TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') >= soi.valid_from 
      AND TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') <= soi.valid_to
""")


QUERY_ERRO_VK11_LIST_PAGINATED = text(QUERY_ERRO_VK11_LIST.text + PAGINATION_SORT_SUFFIX)

QUERY_ERRO_ZAJU_LIST = text("""
    SELECT DISTINCT
        sapmc.msg as mensagem_retorno_integracao,
        o.descricao as orcamento,
        oli.descricao as linha_investimento,
        concat(c.id_externo, ' - ', c.nom_cliente) as cliente,
        sapmc.purch_no_c,
        sapmc.sequencial,
        sapmc.status,
        sapmc.dta_integracao as data_integracao,
        sapmc.dta_alteracao
    FROM suzano_ajuste_provisao_memoria_calculo sapmc
    INNER JOIN orcamento o ON o.id = sapmc.id_orcamento
    INNER JOIN sellin s ON sapmc.id_sellin = s.id 
    INNER JOIN orcamento_linha_investimento oli ON sapmc.id_linha_investimento = oli.id 
    LEFT JOIN cliente c ON c.id = s.id_cliente
    WHERE sapmc.dta_alteracao >= :start_date AND sapmc.dta_alteracao < :end_date 
      AND sapmc.cond_value != 0 
      AND sapmc.status = 'ERRO'
""")

QUERY_ERRO_ZAJU_LIST_PAGINATED = text(QUERY_ERRO_ZAJU_LIST.text + PAGINATION_SORT_SUFFIX)

# ================================
# RELATÓRIOS (Exportação)
# ================================

QUERY_RELATORIO_ZAJU = text("""
    SELECT DISTINCT 
        o.descricao AS "Orcamento",
        oli.descricao AS "Linha de Investimento",
        oti.nome AS "Tipo",
        concat(c.id_externo, ' - ', c.nom_cliente) AS "Cliente",
        s.nro_nota_fiscal AS "Nota Fiscal",
        s.vkorg AS "VKORG",
        s.nro_documento AS "Nº Doc Fat",
        s.valor_total AS "Valor Bruto",
        s.valor_liquido AS "Valor Liquido",
        sapmc.cond_value AS "Provisão",
        sapmc.dta_criacao AS "Data Criação",
        sapmc.purch_no_c AS "Tipo Integração",
        sapmc.tipo_doc AS "Tipo Documento",
        sapmc.sequencial AS "Sequencial",
        concat(sapmc.material, ' - ', p.nom_produto) AS "Material",
        sapmc.unidade_medida AS "Unidade de Medida",
        sapmc.cond_type AS "Condition Type",
        sapmc.waerk AS "Moeda",
        sapmc.status AS "Status",
        sapmc.numfat_integracao AS "Numfat Integração",
        sapmc.numov_integracao AS "Numov Integração",
        sapmc.dta_integracao AS "Data Integração",
        sapmc.msg AS "Erros",
        o.id_tipo_verba -- Interno para separação de abas
    FROM suzano_ajuste_provisao_memoria_calculo sapmc
    LEFT JOIN orcamento o ON o.id = sapmc.id_orcamento
    LEFT JOIN sellin s ON sapmc.id_sellin = s.id 
    LEFT JOIN orcamento_linha_investimento oli ON sapmc.id_linha_investimento = oli.id 
    LEFT JOIN orcamento_tipo_investimento oti ON oti.id = oli.id_tipo_investimento
    LEFT JOIN produto p ON sapmc.material = p.id_externo
    LEFT JOIN cliente c ON c.id = s.id_cliente
    WHERE sapmc.dta_alteracao >= :start_date AND sapmc.dta_alteracao <= :end_date
      AND sapmc.cond_value != 0
      AND sapmc.status NOT IN ('PENDENTE_INTEGRACAO1', 'STATUS_INVALIDO', 'INVALIDO')
    ORDER BY "Data Criação" DESC;
""")

QUERY_RELATORIO_CG_ELEGIVEIS = text("""
    SELECT
       concat(cg.id_externo,' - ',cg.nom_extensao) as "Customer Group",
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
      AND s.dta_emissao >= :start_date
      AND s.dta_emissao <= :end_date
      AND s.valor_total > 0
    GROUP BY cg.id_externo, cg.nom_extensao, marca.nom_extensao
    ORDER BY cg.id_externo ASC;
""")

QUERY_RELATORIO_SALDOS = text("""
    SELECT
        -- Campos de identificação
        concat(e.id_externo, ' - ', e.nom_extensao) AS "Customer Group",
        oli.descricao AS "Linha de Investimento",
        o.descricao AS "Orçamento",
        otv.nome AS "Tipo Verba",
        afp.descricao AS "Período",
        -- Valor Planejado Inicial
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(cc.vlr_planejado AS NUMERIC(15,2))::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(cc.vlr_planejado AS NUMERIC(15,2))::VARCHAR, '.', ','), ' %')
            ELSE CAST(cc.vlr_planejado AS VARCHAR)
        END AS "Planejado Inicial",
        -- Valor Adicionado
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(cc.vlr_adendo AS NUMERIC(15,2))::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(cc.vlr_adendo AS NUMERIC(15,2))::VARCHAR, '.', ','), ' %')
            ELSE CAST(cc.vlr_adendo AS VARCHAR)
        END AS "Vlr Adendo",
        -- Valor Reduzido
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(cc.vlr_reducao AS NUMERIC(15,2))::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(cc.vlr_reducao AS NUMERIC(15,2))::VARCHAR, '.', ','), ' %')
            ELSE CAST(cc.vlr_reducao AS VARCHAR)
        END AS "Vlr Redução",
        -- Cálculo do Valor Planejado Líquido
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(
                (cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao)
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(
                (cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao)
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ','), ' %')
            ELSE CAST((cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao) AS VARCHAR)
        END AS "Vlr Planejado Líquido",
        -- Cálculo do Valor Reservado Total
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(
                (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao)
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(
                (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao)
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ','), ' %')
            ELSE CAST((cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao) AS VARCHAR)
        END AS "Vlr Reservado Total",
        -- Valor Consumido
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(cc.vlr_consumido AS NUMERIC(15,2))::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(cc.vlr_consumido AS NUMERIC(15,2))::VARCHAR, '.', ','), ' %')
            ELSE CAST(cc.vlr_consumido AS VARCHAR)
        END AS "Vlr Consumido",
        -- Cálculo do Valor Disponível
        CASE
            WHEN otv.id = 6 THEN REPLACE(CAST(
                (
                    (cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao)
                    - (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao)
                    - cc.vlr_consumido
                )
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ',')
            WHEN otv.id = 5 THEN CONCAT(REPLACE(CAST(
                (
                    (cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao)
                    - (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao)
                    - cc.vlr_consumido
                )
                AS NUMERIC(15,2)
            )::VARCHAR, '.', ','), ' %')
            ELSE CAST(((cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao) - (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao) - cc.vlr_consumido) AS VARCHAR)
        END AS "Vlr Disponível"
    FROM
        conta_corrente cc
    INNER JOIN
        conta_corrente_posse ccp ON ccp.id = cc.id_posse
    INNER JOIN
        conta_corrente_agrupamento_cliente ccac ON ccac.id = ccp.id_agrupamento_cliente 
    INNER JOIN
        extensao e ON e.id = ccac.id_extensao
    INNER JOIN
        orcamento_desdobramento od ON od.id = cc.id_desdobramento
    INNER JOIN
        orcamento_linha_investimento oli ON oli.id = od.id_linha_investimento
    INNER JOIN
        orcamento_tipo_verba otv ON otv.id = cc.id_tipo_verba
    INNER JOIN
        ano_fiscal_periodo afp ON afp.id = od.id_periodo_orcamentario
    INNER JOIN
        orcamento o ON o.id = oli.id_orcamento
    WHERE
        afp.data_inicio >= :start_date
        AND afp.data_fim <= :end_date
        AND otv.id IN (5,6)
        AND CAST(
            (
                (cc.vlr_planejado + cc.vlr_adendo - cc.vlr_reducao)
                - (cc.vlr_reservado + cc.vlr_conf_acao + cc.vlr_conf_apuracao)
                - cc.vlr_consumido
            )
            AS NUMERIC(15,2)
        ) > 0;
""")
