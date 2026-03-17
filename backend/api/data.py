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
    QUERY_ERRO_PAGAMENTOS_LIST_PAGINATED
)

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

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
        
        # Executando consultas no PostgreSQL
        # Orcamento Integracao requer string (VARCHAR)
        vk11_res = await db.execute(QUERY_ORCAMENTO_INTEGRACAO, params_str)
        # O restante requer timestamp
        zaju_res = await db.execute(QUERY_ZAJU, params)
        zver_res = await db.execute(QUERY_PAGAMENTOS, params)
        
        # Otimização: contando inconsistências direto via SQL para não sobrecarregar a memória
        async def get_count(q):
            raw_text = q.text.strip().rstrip(';')
            count_query = text(f"SELECT COUNT(1) AS total FROM ({raw_text}) AS subquery")
            res = await db.execute(count_query, params)
            return res.scalar() or 0

        sellin_count = await get_count(QUERY_ERRO_SELLIN)
        clientes_count = await get_count(QUERY_ERRO_CLIENTES)
        produtos_count = await get_count(QUERY_ERRO_PRODUTOS)
        cutoff_count = await get_count(QUERY_ERRO_CUTOFF)
        usuarios_count = await get_count(QUERY_ERRO_USUARIOS)
        pagamentos_count = await get_count(QUERY_ERRO_PAGAMENTOS_LIST)

        # Consolidando (agregando linhas separadas de volta num painel geral do dashboard)
        vk11_rows = vk11_res.mappings().all()
        vk11_totals = {
            "success": sum(r["integrado"] or 0 for r in vk11_rows),
            "pending": sum(r["pendente_integracao"] or 0 for r in vk11_rows),
            "error": sum(r["erro"] or 0 for r in vk11_rows)
        }

        zaju_rows = zaju_res.mappings().all()
        zaju_totals = {
            "success": sum(r["integrado"] or 0 for r in zaju_rows),
            "pending": sum(r["pendente_integracao"] or 0 for r in zaju_rows),
            "error": sum(r["erro"] or 0 for r in zaju_rows),
            "pending_return": sum(r["pendente_retorno"] or 0 for r in zaju_rows)
        }

        zver_rows = zver_res.mappings().all()
        zver_totals = {
            "success": sum(r["integrado"] or 0 for r in zver_rows),
            "pending": sum(r["pendente_integracao"] or 0 for r in zver_rows),
            "error": sum(r["erro"] or 0 for r in zver_rows),
            "pending_return": sum(r["pendente_retorno"] or 0 for r in zver_rows)
        }

        # Contagem de inconsistências que afetam o BD
        return {
            "source": "postgresql",
            "vk11": vk11_totals,
            "zaju": zaju_totals,
            "zver": zver_totals,
            "errors": {
                "sellin": sellin_count,
                "clientes": clientes_count,
                "produtos": produtos_count,
                "cutoff": cutoff_count,
                "usuarios": usuarios_count,
                "pagamentos": pagamentos_count
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
        
        query_map = {
            "sellin": (QUERY_ERRO_SELLIN_PAGINATED, QUERY_ERRO_SELLIN),
            "clientes": (QUERY_ERRO_CLIENTES_PAGINATED, QUERY_ERRO_CLIENTES),
            "produtos": (QUERY_ERRO_PRODUTOS_PAGINATED, QUERY_ERRO_PRODUTOS),
            "cutoff": (QUERY_ERRO_CUTOFF_PAGINATED, QUERY_ERRO_CUTOFF),
            "usuarios": (QUERY_ERRO_USUARIOS_PAGINATED, QUERY_ERRO_USUARIOS),
            "pagamentos": (QUERY_ERRO_PAGAMENTOS_LIST_PAGINATED, QUERY_ERRO_PAGAMENTOS_LIST)
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
            
        # Obter os dados paginados
        res = await db.execute(final_query, params)
        rows = [dict(row) for row in res.mappings().all()]
        
        # Obter o offset total executando a count original (poderia ser trocado por COUNT(*) em produção real)
        count_res = await db.execute(count_query, params_count)
        total_count = len(count_res.mappings().all())
        
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
