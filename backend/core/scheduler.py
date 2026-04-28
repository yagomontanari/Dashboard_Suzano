from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.future import select
from sqlalchemy import text
import logging
import asyncio
from datetime import datetime, timedelta

from core.database_app import AppSessionLocal as AsyncSessionLocalApp
from core.database import AsyncSessionLocal
from core.models_app import NotificationRecipient, NotificationSchedule
from core.mail import mail_service
from api.queries import *

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def fetch_data(session, q, p):
    res = await session.execute(q, p)
    return [dict(row) for row in res.mappings().all()]

async def process_notification_job():
    """
    Coleta dados consolidados do dashboard e envia por e-mail para todos os destinatários ativos.
    """
    logger.info("Iniciando job de notificação operacional...")
    
    try:
        # 1. Obter Destinatários
        async with AsyncSessionLocalApp() as db_app:
            result = await db_app.execute(select(NotificationRecipient).where(NotificationRecipient.active == True))
            recipients = result.scalars().all()
            
            if not recipients:
                logger.warning("Nenhum destinatário ativo encontrado para notificações.")
                return
            
            email_list = [r.email for r in recipients]

        # 2. Coletar Dados das Integrações (Mês Atual)
        now = datetime.now()
        start_dt = datetime(now.year, now.month, 1)
        end_dt = (start_dt + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        params = {"start_date": start_dt, "end_date": end_dt}
        params_str = {
            "start_date": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "end_date": end_dt.strftime("%Y-%m-%d %H:%M:%S"),
        }

        async with AsyncSessionLocal() as db_metrics:
            # Sessões do SQLAlchemy não são thread/concurrency-safe para rodar no mesmo context em asyncio.gather
            # Executando de forma sequencial
            vk11_res = await fetch_data(db_metrics, QUERY_ORCAMENTO_INTEGRACAO_TOTAL, params_str)
            zaju_res = await fetch_data(db_metrics, QUERY_ZAJU_TOTAL, params)
            zaju_by_type_res = await fetch_data(db_metrics, QUERY_ZAJU_BY_TYPE, params)
            zver_res = await fetch_data(db_metrics, QUERY_PAGAMENTOS_TOTAL, params)
            counts_res = await fetch_data(db_metrics, QUERY_DASHBOARD_COUNTS_CONSOLIDATED, params)
            last_sync_res = await fetch_data(db_metrics, QUERY_LAST_SYNC, {})

            # Processamento de Dados
            counts = counts_res[0] if counts_res else {}
            
            # VK11
            vk11 = vk11_res[0] if vk11_res else {"success": 0, "pending": 0, "error": 0}
            
            # ZAJU
            zaju = zaju_res[0] if zaju_res else {"success": 0, "pending": 0, "error": 0, "pending_return": 0}
            zaju_details = zaju_by_type_res or []
            
            # ZVER
            zver = zver_res[0] if zver_res else {"success": 0, "pending": 0, "error": 0, "pending_return": 0}

            # 3. Gerar Arquivo Excel Consolidado com as Inconsistências
            import pandas as pd
            import io
            from api.data import apply_excel_premium_style

            # Consultar detalhamento das inconsistências
            sellin_det = await fetch_data(db_metrics, QUERY_ERRO_SELLIN_DETALHADO, params)
            clientes_det = await fetch_data(db_metrics, QUERY_ERRO_CLIENTES, params)
            produtos_det = await fetch_data(db_metrics, QUERY_ERRO_PRODUTOS, params)
            cutoff_det = await fetch_data(db_metrics, QUERY_ERRO_CUTOFF, params)
            usuarios_det = await fetch_data(db_metrics, QUERY_ERRO_USUARIOS, params)
            pagamentos_det = await fetch_data(db_metrics, QUERY_ERRO_PAGAMENTOS_LIST, params)

            # Criar os DataFrames
            dfs = {
                "Sell-In": pd.DataFrame(sellin_det) if sellin_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Sell-In no período."}]),
                "Clientes": pd.DataFrame(clientes_det) if clientes_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Clientes no período."}]),
                "Produtos": pd.DataFrame(produtos_det) if produtos_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Produtos no período."}]),
                "Cutoff": pd.DataFrame(cutoff_det) if cutoff_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Cutoff no período."}]),
                "Usuarios": pd.DataFrame(usuarios_det) if usuarios_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Usuários no período."}]),
                "Pagamentos": pd.DataFrame(pagamentos_det) if pagamentos_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Pagamentos no período."}])
            }

            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
                for sheet_name, df in dfs.items():
                    df.to_excel(writer, index=False, sheet_name=sheet_name)
                    apply_excel_premium_style(writer, sheet_name)

            excel_bytes = excel_buffer.getvalue()

            # 4. Montar Resumo para o E-mail
            meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
            periodo_nome = f"{meses[start_dt.month]} {start_dt.year}"
            arquivo_nome = f"Inconsistencias_{meses[start_dt.month]}_{start_dt.year}.xlsx"

            summary_data = {
                "periodo": periodo_nome,
                "vk11": vk11,
                "zaju": {
                    "total_integrado": zaju["success"],
                    "total_pendente": zaju["pending"],
                    "total_erro": zaju["error"],
                    "total_retorno": zaju["pending_return"],
                    "detalhamento_pendentes": {
                        "Verba Nominal/Fixa": sum(i["pending"] for i in zaju_details if 'NOMI' in i["type"] or 'Fixas' in i["category"]),
                        "Verba Off": sum(i["pending"] for i in zaju_details if 'OFF' in i["type"] or 'Off' in i["category"]),
                        "CutOff Mes_Corrente": sum(i["pending"] for i in zaju_details if i["type"] == 'ZAJU_CUTOFF_MES_CORRENTE'),
                        "CutOff Mes_Anterior": sum(i["pending"] for i in zaju_details if i["type"] == 'ZAJU_CUTOFF_MES_ANTERIOR'),
                        "ZAJU_AJUSTE_PGTO": sum(i["pending"] for i in zaju_details if i["type"] == 'ZAJU_AJUSTE_PGTO'),
                        "ZAJU_PGTO_REPROVADO": sum(i["pending"] for i in zaju_details if i["type"] == 'ZAJU_PGTO_REPROVADO'),
                    }
                },
                "zver": zver,
                "inconsistencias": {
                    "SELLIN": counts.get("sellin", 0),
                    "CLIENTES": counts.get("clientes", 0),
                    "PRODUTOS": counts.get("produtos", 0),
                    "CUTOFF": counts.get("cutoff", 0),
                    "USUARIOS": counts.get("usuarios", 0),
                    "PAGAMENTOS": counts.get("pagamentos", 0)
                },
                "last_sync": last_sync_res
            }

            # 5. Enviar E-mails
            for email in email_list:
                await mail_service.send_operational_summary_email(email, summary_data, excel_bytes, arquivo_nome)
                
        logger.info("Job de notificação operacional concluído com sucesso.")

    except Exception as e:
        logger.error(f"Erro ao processar job de notificação: {e}")

async def restart_scheduler():
    """
    Sincroniza os jobs do scheduler com o banco de dados.
    """
    logger.info("Sincronizando scheduler com banco de dados...")
    
    # Remover todos os jobs de cron existentes
    for job in scheduler.get_jobs():
        if job.id.startswith("notif_"):
            scheduler.remove_job(job.id)
            
    try:
        async with AsyncSessionLocalApp() as db_app:
            result = await db_app.execute(select(NotificationSchedule).where(NotificationSchedule.active == True))
            schedules = result.scalars().all()
            
            for s in schedules:
                try:
                    hour, minute = s.time.split(":")
                    scheduler.add_job(
                        process_notification_job,
                        CronTrigger(hour=hour, minute=minute),
                        id=f"notif_{s.id}"
                    )
                    logger.info(f"Agendamento adicionado: {s.time} (ID: {s.id})")
                except ValueError:
                    logger.error(f"Formato de horário inválido: {s.time} (ID: {s.id})")
                    
    except Exception as e:
        logger.error(f"Erro ao sincronizar scheduler: {e}")
