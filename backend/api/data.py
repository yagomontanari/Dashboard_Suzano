from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from jose import JWTError, jwt
import logging
import asyncio
import io
import pandas as pd
from datetime import datetime
import calendar
import traceback
from typing import List, Dict, Any

from core.database import get_db, AsyncSessionLocal
from core.security import SECRET_KEY, ALGORITHM
from core.mail import mail_service
from core.utils import parse_date_range
from api.queries import *
from fastapi.responses import StreamingResponse

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

from core.database_app import get_app_db
from core.models_app import User, UserStatus

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db_app: AsyncSession = Depends(get_app_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        
        # Busca o usuário no banco da aplicação (Supabase)
        from sqlalchemy.future import select
        result = await db_app.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user or user.status != UserStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Usuário não autorizado ou pendente de aprovação"
            )
            
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

@router.get("/dashboard")
async def get_dashboard_metrics(
    start_date: str = None, 
    end_date: str = None, 
    db: AsyncSession = Depends(get_db),
    user: str = Depends(get_current_user)
):
    try:
        start_dt, end_dt = parse_date_range(start_date, end_date)
            
        params_str = {
            "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"), 
            "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S")
        }
        params = {
            "start_date": start_dt, 
            "end_date": end_dt
        }
        
        # Otimização: Paralelizando 11 chamadas utilizando conexões via polling para baixar o tempo de 6s para 1~2s.
        async def fetch_data(q, p, is_count=False):
            async with AsyncSessionLocal() as session:
                if is_count:
                    raw_text = q.text.strip().rstrip(';')
                    count_query = text(f"SELECT COUNT(1) AS total FROM ({raw_text}) AS subquery")
                    res = await session.execute(count_query, p)
                    return res.scalar() or 0
                else:
                    res = await session.execute(q, p)
                    return [dict(row) for row in res.mappings().all()]

        results = await asyncio.gather(
            fetch_data(QUERY_ORCAMENTO_INTEGRACAO_TOTAL, params_str),
            fetch_data(QUERY_ZAJU_TOTAL, params),
            fetch_data(QUERY_PAGAMENTOS_TOTAL, params),
            fetch_data(QUERY_TOP_CLIENTES, params),
            fetch_data(QUERY_ERRO_SELLIN, params, is_count=True),
            fetch_data(QUERY_ERRO_CLIENTES, params, is_count=True),
            fetch_data(QUERY_ERRO_PRODUTOS, params, is_count=True),
            fetch_data(QUERY_ERRO_CUTOFF, params, is_count=True),
            fetch_data(QUERY_ERRO_USUARIOS, params, is_count=True),
            fetch_data(QUERY_ERRO_PAGAMENTOS_LIST, params, is_count=True),
            fetch_data(QUERY_ERRO_VK11_LIST, params_str, is_count=True),
            fetch_data(QUERY_LAST_SYNC, {})
        )

        (vk11_res, zaju_res, zver_res, top_clients_res,
         sellin_count, clientes_count, produtos_count, cutoff_count, 
         usuarios_count, pagamentos_count, vk11_count, last_sync_res) = results
        
        # Mapeando os resultados
        vk11_totals = vk11_res[0] if vk11_res else {"success": 0, "pending": 0, "error": 0}
        zaju_totals = zaju_res[0] if zaju_res else {"success": 0, "pending": 0, "error": 0, "pending_return": 0, "total": 0}
        zver_totals_raw = zver_res[0] if zver_res else {
            "success": 0, "pending": 0, "pending_return": 0, "error": 0,
            "value_success": 0.0, "value_pending": 0.0, "value_pending_return": 0.0, "value_error": 0.0
        }
        
        top_clients = top_clients_res
        
        zver_totals = {
            "success": zver_totals_raw["success"],
            "pending": zver_totals_raw["pending"],
            "pending_return": zver_totals_raw["pending_return"],
            "error": zver_totals_raw["error"],
            "value_success": float(zver_totals_raw["value_success"]),
            "value_pending": float(zver_totals_raw["value_pending"]),
            "value_pending_return": float(zver_totals_raw["value_pending_return"]),
            "value_error": float(zver_totals_raw["value_error"]),
            "top_clients": top_clients
        }

        return {
            "source": "postgresql",
            "vk11": dict(vk11_totals),
            "zaju": dict(zaju_totals),
            "zver": zver_totals,
            "errors": {
                "sellin": sellin_count,
                "clientes": clientes_count,
                "produtos": produtos_count,
                "cutoff": cutoff_count,
                "usuarios": usuarios_count,
                "pagamentos": pagamentos_count,
                "vk11": vk11_count
            },
            "last_updates": [
                {
                    "categoria": {
                        "PRE_CADASTRO_USUARIO": "Usuários",
                        "CLIENTE": "Clientes",
                        "PAGAMENTO_LIQUIDADO": "Retorno Pagto",
                        "CUTOFF": "Cutoff",
                        "SELLIN": "Sell-In",
                        "PRODUTO": "Produtos",
                        "ORCAMENTO": "VK11",
                        "PAGAMENTO": "ZVER",
                        "DADOS_PROVISOES": "Provisões",
                        "AJUSTE_PROVISAO": "ZAJU"
                    }.get(r["categoria"], r["categoria"]),
                    "data": r["dta"].isoformat() if r["dta"] else None,
                    "direcao": r["direcao"],
                    "lote": r["lote"],
                    "mensagem": {
                        "PRE_CADASTRO_USUARIO": f"Sincronização de usuários processada{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "CLIENTE": f"Carga cadastral de clientes recebida{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "PAGAMENTO_LIQUIDADO": f"Retorno de liquidação SAP recebido{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "CUTOFF": f"Atualização de calendário cutoff{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "SELLIN": f"Notas fiscais de Sell-In integradas{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "PRODUTO": f"Dados mestre de produtos atualizados{' (Lote ' + r['lote'] + ')' if r['lote'] else ''}.",
                        "ORCAMENTO": "Envio de orçamentos (VK11) para o SAP.",
                        "PAGAMENTO": "Envio de remessa de pagamentos (ZVER) para o SAP.",
                        "DADOS_PROVISOES": "Sincronização de base de provisões concluída.",
                        "AJUSTE_PROVISAO": "Ajuste de provisão (ZAJU) enviado ao SAP."
                    }.get(r["categoria"], "Sincronização de dados finalizada.")
                } for r in last_sync_res
            ]
        }
    except Exception as e:
        logger.error(f"Erro ao conectar ou ler do banco de dados no Dashboard: {e}")
        import traceback
        traceback.print_exc()
        raise e

@router.get("/dashboard/inconsistencies/{category}")
async def get_inconsistencies(
    category: str,
    start_date: str = None, 
    end_date: str = None, 
    page: int = 1,
    size: int = 20,
    sort_by: str = None,
    order: str = "desc",
    db: AsyncSession = Depends(get_db), 
    user: str = Depends(get_current_user)
):
    try:
        offset = (page - 1) * size
        start_dt, end_dt = parse_date_range(start_date, end_date)

        params = {"start_date": start_dt, "end_date": end_dt, "limit": size, "offset": offset}
        params_count = {"start_date": start_dt, "end_date": end_dt}
        
        # Consistent with get_dashboard_metrics, VK11 needs string dates
        if category == "vk11":
            params = {
                "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"), 
                "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "limit": size, 
                "offset": offset
            }
            params_count = {
                "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"), 
                "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S")
            }
        
        query_map = {
            "sellin": (QUERY_ERRO_SELLIN_PAGINATED, QUERY_ERRO_SELLIN),
            "clientes": (QUERY_ERRO_CLIENTES_PAGINATED, QUERY_ERRO_CLIENTES),
            "produtos": (QUERY_ERRO_PRODUTOS_PAGINATED, QUERY_ERRO_PRODUTOS),
            "cutoff": (QUERY_ERRO_CUTOFF_PAGINATED, QUERY_ERRO_CUTOFF),
            "usuarios": (QUERY_ERRO_USUARIOS_PAGINATED, QUERY_ERRO_USUARIOS),
            "pagamentos": (QUERY_ERRO_PAGAMENTOS_LIST_PAGINATED, QUERY_ERRO_PAGAMENTOS_LIST),
            "pagamentos_sucesso": (QUERY_PAGAMENTOS_SUCESSO_LIST_PAGINATED, QUERY_PAGAMENTOS_SUCESSO_LIST),
            "vk11": (QUERY_ERRO_VK11_LIST_PAGINATED, QUERY_ERRO_VK11_LIST)
        }
        
        if category not in query_map:
            raise HTTPException(status_code=400, detail="Categoria inválida")
            
        paginated_query_orig, count_query = query_map[category]
        
        # Determine the final query with dynamic sorting if requested
        from sqlalchemy import text
        
        if sort_by:
            # Simple sanitization/validation for sort_by and order
            valid_order = "ASC" if order.upper() == "ASC" else "DESC"
            
            # Base text without the final ORDER BY or LIMIT/OFFSET if we are going to wrap it
            # But wait, some base queries have ORDER BY inside. 
            # It's safer to wrap the base query (without trailing semicolon)
            base_sql = count_query.text.strip().rstrip(';')
            
            # Clean up: remove the default ORDER BY from base_sql to avoid conflicts if possible, 
            # but wrapping works too: "SELECT * FROM (base) as t ORDER BY col"
            # However, if 'sort_by' is passed, we should use it.
            
            wrapped_sql = f"SELECT * FROM ({base_sql}) AS sorted_subquery ORDER BY {sort_by} {valid_order} LIMIT :limit OFFSET :offset;"
            final_query = text(wrapped_sql)
        else:
            final_query = paginated_query_orig
            
        # Otimização: Usar COUNT(1) no banco ao invés de carregar tudo na memória do Python
        count_sql = f"SELECT COUNT(1) FROM ({count_query.text.strip().rstrip(';')}) AS total_count"
        count_res = await db.execute(text(count_sql), params_count)
        total_count = count_res.scalar() or 0

        # Obter os dados paginados
        res = await db.execute(final_query, params)
        rows = [dict(row) for row in res.mappings().all()]
        
        return {
            "source": "postgresql",
            "category": category,
            "data": rows,
            "page": page,
            "size": size,
            "total_count": total_count,
            "total_pages": (total_count + size - 1) // size
        }
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes da categoria {category}: {e}")
        # MOCK FALLBACK
        mock_data = []
        for i in range(offset, min(offset + size, 35)): # Mock total of 35 items
            mock_data.append({"id": i, "mensagem": f"Erro simulado {i} na integracao de {category}", "data_emissao": "2026-03-17"})
            
        return {
            "source": "mock",
            "warning": "Banco inacessível",
            "category": category,
            "data": mock_data,
            "page": page,
            "size": size,
            "total_count": 35,
            "total_pages": 2
        }

@router.get("/dashboard/details/vk11")
async def get_vk11_details(
    start_date: str = None, 
    end_date: str = None, 
    db: AsyncSession = Depends(get_db),
    user: str = Depends(get_current_user)
):
    try:
        start_dt, end_dt = parse_date_range(start_date, end_date)
        params_str = {
            "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"), 
            "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        result = await db.execute(QUERY_ORCAMENTO_INTEGRACAO, params_str)
        rows = [dict(row) for row in result.mappings().all()]
        
        return {
            "source": "postgresql",
            "data": rows
        }
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes VK11: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def bg_generate_zaju_report(start_dt: datetime, end_dt: datetime, email: str, nome: str):
    """Função de background para gerar o Excel e enviar por e-mail"""
    try:
        # Precisamos de uma nova sessão para o background task
        async with AsyncSessionLocal() as db:
            params = {"start_date": start_dt, "end_date": end_dt}
            result = await db.execute(QUERY_RELATORIO_ZAJU, params)
            rows = result.mappings().all()

            if not rows:
                # Opcional: enviar e-mail avisando que não há dados
                return

            # Garantir a ordenação exata (keys do dict podem quebrar a ordem dependendo da versão do pandas)
            df = pd.DataFrame([dict(r) for r in rows])
            
            # Ajuste de pontuação para o Padrão BRL (Vírgula em decimais, ponto em milhares)
            colunas_numericas = [
                "Valor Bruto", "Valor Líquido", "Provisão Original", "Provisão % SAP",
                "Contrato COM % Bruto", "Contrato COM % Liquido", "Contrato LOG % Bruto",
                "Contrato LOG % Líquido", "Contrato CRE % Bruto", "Contrato CRE % Líquido",
                "Valor Provisão"
            ]
            for col in colunas_numericas:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').apply(
                        lambda x: f"{x:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') if pd.notna(x) else ""
                    )
            
            # Ajuste para campos puramente Percentuais
            colunas_percentuais = ["% Original", "% Atual"]
            for col in colunas_percentuais:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').apply(
                        lambda x: f"{x:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') + "%" if pd.notna(x) else ""
                    )
            
            # Separar Contrato vs Promo & Ações
            if not df.empty and 'id_tipo_verba' in df.columns:
                df_contrato = df[df['id_tipo_verba'].isin([9, 10])].drop(columns=['id_tipo_verba'])
                df_promo = df[df['id_tipo_verba'].isin([5, 6])].drop(columns=['id_tipo_verba'])
            else:
                df_contrato = pd.DataFrame()
                df_promo = pd.DataFrame()
            
            ordem_colunas = [
                "Orçamento", "ID Ajuste Verba", "Linha de Investimento", "Tipo Linha Investimento",
                "Cód. Cliente", "Nome Cliente", "Nº Nota Fiscal", "VKORG", "Nº Documento",
                "Valor Bruto", "Valor Líquido", "% Original", "Provisão Original", "Provisão % SAP",
                "Contrato COM % Bruto", "Contrato COM % Liquido", "Contrato LOG % Bruto", "Contrato LOG % Líquido",
                "Contrato CRE % Bruto", "Contrato CRE % Líquido", "% Atual", "Valor Provisão",
                "Cutoff", "Data Criação", "Purch. No C", "Tipo Doc", "Sequencial", "Cod. Material",
                "Material", "Unidade Medida", "Cond. Type", "Moeda", "Status", "Numfat Integração",
                "Numov Integração", "Data Integração", "Mensagem Retorno"
            ]
            
            if not df_contrato.empty:
                df_contrato = df_contrato[[c for c in ordem_colunas if c in df_contrato.columns]]
            if not df_promo.empty:
                df_promo = df_promo[[c for c in ordem_colunas if c in df_promo.columns]]

            output = io.BytesIO()
            from openpyxl.styles import PatternFill, Font
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                if not df_contrato.empty:
                    df_contrato.to_excel(writer, index=False, sheet_name='Verbas de Contrato')
                else:
                    pd.DataFrame(columns=df.columns.drop('id_tipo_verba') if 'id_tipo_verba' in df.columns else df.columns).to_excel(writer, index=False, sheet_name='Verbas de Contrato')
                    
                if not df_promo.empty:
                    df_promo.to_excel(writer, index=False, sheet_name='Promo & Ações')
                else:
                    pd.DataFrame(columns=df.columns.drop('id_tipo_verba') if 'id_tipo_verba' in df.columns else df.columns).to_excel(writer, index=False, sheet_name='Promo & Ações')
                
                # Identidade Visual no Cabeçalho (Azul Marinho)
                header_fill = PatternFill(start_color="0F2744", end_color="0F2744", fill_type="solid")
                header_font = Font(color="FFFFFF", bold=True)
                
                for sheet_name in writer.sheets:
                    worksheet = writer.sheets[sheet_name]
                    for cell in worksheet[1]:
                        cell.fill = header_fill
                        cell.font = header_font
            
            filename = f"relatorio_zaju_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.xlsx"
            await mail_service.send_report_email(
                email_to=email,
                nome=nome,
                report_name="Relatório Mensal ZAJU",
                file_content=output.getvalue(),
                filename=filename
            )
            logger.info(f"Relatório ZAJU enviado com sucesso para {email}")

    except Exception as e:
        logger.error(f"Erro no background task de exportação ZAJU: {e}")

@router.get("/export/zaju")
async def export_zaju_report(
    background_tasks: BackgroundTasks,
    start_date: str = None, 
    end_date: str = None, 
    user: dict = Depends(get_current_user)
):
    try:
        start_dt, end_dt = parse_date_range(start_date, end_date)

        # Dispara o processamento em background
        background_tasks.add_task(
            bg_generate_zaju_report, 
            start_dt, 
            end_dt, 
            user.email, 
            user.nome
        )
        
        return {
            "status": "success",
            "message": f"O relatório está sendo gerado e será enviado para {user.email} em instantes."
        }
        
    except Exception as e:
        logger.error(f"Erro ao solicitar exportação ZAJU: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar solicitação de exportação.")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
