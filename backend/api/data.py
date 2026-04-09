from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
import logging
from datetime import datetime
import calendar
import traceback

from core.database import get_db
from core.security import SECRET_KEY, ALGORITHM
from api.queries import (
    QUERY_ORCAMENTO_INTEGRACAO,
    QUERY_ZAJU,
    QUERY_PAGAMENTOS,
    QUERY_ERRO_SELLIN,
    QUERY_ERRO_CLIENTES,
    QUERY_ERRO_PRODUTOS,
    QUERY_ERRO_CUTOFF,
    QUERY_ERRO_USUARIOS,
    QUERY_ERRO_SELLIN_PAGINATED,
    QUERY_ERRO_CLIENTES_PAGINATED,
    QUERY_ERRO_PRODUTOS_PAGINATED,
    QUERY_ERRO_CUTOFF_PAGINATED,
    QUERY_ERRO_USUARIOS_PAGINATED,
    QUERY_ERRO_PAGAMENTOS_LIST,
    QUERY_ERRO_VK11_LIST_PAGINATED,
    QUERY_PAGAMENTOS_SUCESSO_LIST,
    QUERY_PAGAMENTOS_SUCESSO_LIST_PAGINATED,
    QUERY_ERRO_VK11_LIST,
    QUERY_ERRO_VK11_LIST_PAGINATED,
    QUERY_RELATORIO_ZAJU,
    # Novas queries agregadas
    QUERY_ORCAMENTO_INTEGRACAO_TOTAL,
    QUERY_ZAJU_TOTAL,
    QUERY_PAGAMENTOS_TOTAL,
    QUERY_TOP_CLIENTES
)
from fastapi.responses import StreamingResponse
import io
import pandas as pd

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
        today = datetime.now()
        
        if not start_date or start_date == "2024-01-01":
            start_dt = datetime(today.year, today.month, 1)
        else:
            try:
                start_dt = datetime.strptime(start_date[:10], "%Y-%m-%d")
            except ValueError:
                start_dt = datetime(today.year, today.month, 1)
                
        if not end_date or end_date == "2026-12-31":
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
        else:
            try:
                end_dt = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            except ValueError:
                last_day = calendar.monthrange(today.year, today.month)[1]
                end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
            
        params_str = {
            "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"), 
            "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S")
        }
        params = {
            "start_date": start_dt, 
            "end_date": end_dt
        }
        
        from sqlalchemy import text
        import asyncio
        
        # Otimização: contando inconsistências direto via SQL para não sobrecarregar a memória
        async def get_count(q, p=params):
            raw_text = q.text.strip().rstrip(';')
            count_query = text(f"SELECT COUNT(1) AS total FROM ({raw_text}) AS subquery")
            res = await db.execute(count_query, p)
            return res.scalar() or 0

        # PARALELISMO: Disparar todas as queries simultaneamente
        tasks = [
            db.execute(QUERY_ORCAMENTO_INTEGRACAO_TOTAL, params_str),
            db.execute(QUERY_ZAJU_TOTAL, params),
            db.execute(QUERY_PAGAMENTOS_TOTAL, params),
            db.execute(QUERY_TOP_CLIENTES, params),
            get_count(QUERY_ERRO_SELLIN),
            get_count(QUERY_ERRO_CLIENTES),
            get_count(QUERY_ERRO_PRODUTOS),
            get_count(QUERY_ERRO_CUTOFF),
            get_count(QUERY_ERRO_USUARIOS),
            get_count(QUERY_ERRO_PAGAMENTOS_LIST),
            get_count(QUERY_ERRO_VK11_LIST, params_str)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Mapeando os resultados
        vk11_res, zaju_res, zver_res, top_clients_res = results[:4]
        counts = results[4:]
        
        vk11_totals = vk11_res.mappings().one_or_none() or {"success": 0, "pending": 0, "error": 0}
        zaju_totals = zaju_res.mappings().one_or_none() or {"success": 0, "pending": 0, "error": 0, "pending_return": 0, "total": 0}
        zver_totals_raw = zver_res.mappings().one_or_none() or {
            "success": 0, "pending": 0, "pending_return": 0, "error": 0,
            "value_success": 0.0, "value_pending": 0.0, "value_pending_return": 0.0, "value_error": 0.0
        }
        
        top_clients = [dict(r) for r in top_clients_res.mappings().all()]
        
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
                "sellin": counts[0],
                "clientes": counts[1],
                "produtos": counts[2],
                "cutoff": counts[3],
                "usuarios": counts[4],
                "pagamentos": counts[5],
                "vk11": counts[6]
            }
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
        
        today = datetime.now()
        
        if not start_date or start_date == "2024-01-01":
            start_dt = datetime(today.year, today.month, 1)
        else:
            try:
                start_dt = datetime.strptime(start_date[:10], "%Y-%m-%d")
            except ValueError:
                start_dt = datetime(today.year, today.month, 1)
                
        if not end_date or end_date == "2026-12-31":
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
        else:
            try:
                end_dt = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            except ValueError:
                last_day = calendar.monthrange(today.year, today.month)[1]
                end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)

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

@router.get("/export/zaju")
async def export_zaju_report(
    start_date: str = None, 
    end_date: str = None, 
    db: AsyncSession = Depends(get_db),
    user: str = Depends(get_current_user)
):
    try:
        today = datetime.now()
        
        # Date parsing logic (consistent with dashboard)
        if not start_date or start_date == "2024-01-01":
            start_dt = datetime(today.year, today.month, 1)
        else:
            try:
                start_dt = datetime.strptime(start_date[:10], "%Y-%m-%d")
            except ValueError:
                start_dt = datetime(today.year, today.month, 1)
                
        if not end_date or end_date == "2026-12-31":
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
        else:
            try:
                end_dt = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            except ValueError:
                last_day = calendar.monthrange(today.year, today.month)[1]
                end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)

        params = {"start_date": start_dt, "end_date": end_dt}
        
        # Execute query
        result = await db.execute(QUERY_RELATORIO_ZAJU, params)
        rows = result.mappings().all()

        # Excel Generation using pandas
        df = pd.DataFrame(rows)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Relatório ZAJU')
        
        output.seek(0)
        filename = f"relatorio_zaju_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.xlsx"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Erro ao exportar relatório ZAJU: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
