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

from pytz import timezone
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=timezone('America/Sao_Paulo'))

async def fetch_data(session, q, p):
    res = await session.execute(q, p)
    return [dict(row) for row in res.mappings().all()]

async def process_notification_job(schedule_id: int):
    """
    Coleta dados consolidados do dashboard e envia por e-mail para todos os destinatários ativos.
    Inclui trava de execução para evitar duplicidade entre workers.
    """
    logger.info(f"Iniciando job de notificação operacional (ID Agendamento: {schedule_id})...")
    
    try:
        # 0. Trava de Execução (Evitar duplicidade entre workers)
        async with AsyncSessionLocalApp() as db_app:
            # Selecionar o agendamento e verificar se já rodou hoje
            res = await db_app.execute(select(NotificationSchedule).where(NotificationSchedule.id == schedule_id))
            schedule = res.scalar_one_or_none()
            
            if not schedule:
                logger.error(f"Agendamento {schedule_id} não encontrado.")
                return

            now_sp = datetime.now(timezone('America/Sao_Paulo'))
            
            if schedule.last_run_at:
                # Converter last_run_at para o timezone de SP para comparação segura
                last_run = schedule.last_run_at
                if last_run.tzinfo is None:
                    last_run = timezone('UTC').localize(last_run).astimezone(timezone('America/Sao_Paulo'))
                else:
                    last_run = last_run.astimezone(timezone('America/Sao_Paulo'))

                # Se já rodou hoje (mesmo dia, mês e ano), abortar
                if last_run.date() == now_sp.date():
                    logger.warning(f"Job {schedule_id} já executado hoje em {last_run}. Abortando para evitar duplicidade.")
                    return

            # 1. Obter Destinatários
            result = await db_app.execute(select(NotificationRecipient).where(NotificationRecipient.active == True))
            recipients = result.scalars().all()
            
            if not recipients:
                logger.warning("Nenhum destinatário ativo encontrado para notificações.")
                return
            
            # Lógica para separar destinatário principal e cópia
            primary_recipient = next((r for r in recipients if r.is_primary), recipients[0])
            cc_list = [r.email for r in recipients if r.email != primary_recipient.email]
            email_to = primary_recipient.email

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
            # Executando de forma sequencial
            vk11_res = await fetch_data(db_metrics, QUERY_ORCAMENTO_INTEGRACAO_TOTAL, params_str)
            zaju_res = await fetch_data(db_metrics, QUERY_ZAJU_TOTAL, params)
            zaju_by_type_res = await fetch_data(db_metrics, QUERY_ZAJU_BY_TYPE, params)
            zver_res = await fetch_data(db_metrics, QUERY_PAGAMENTOS_TOTAL, params)
            counts_res = await fetch_data(db_metrics, QUERY_DASHBOARD_COUNTS_CONSOLIDATED, params)
            last_sync_res = await fetch_data(db_metrics, QUERY_LAST_SYNC, {})

            # Processamento de Dados
            counts = counts_res[0] if counts_res else {}
            vk11 = vk11_res[0] if vk11_res else {"success": 0, "pending": 0, "error": 0}
            zaju = zaju_res[0] if zaju_res else {"success": 0, "pending": 0, "error": 0, "pending_return": 0}
            zaju_details = zaju_by_type_res or []
            zver = zver_res[0] if zver_res else {"success": 0, "pending": 0, "error": 0, "pending_return": 0}

            # 3. Gerar Arquivo Excel Consolidado
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
            zaju_erros_det = await fetch_data(db_metrics, QUERY_ERRO_ZAJU_LIST, params)
            vk11_erros_det = await fetch_data(db_metrics, QUERY_ERRO_VK11_LIST, params)

            # Processamento de DataFrames
            dfs = {
                "Resumo Geral": pd.DataFrame([{
                    "Mês Ref": f"{now.month}/{now.year}",
                    "VK11 Sucesso": vk11["success"],
                    "VK11 Pendente": vk11["pending"],
                    "VK11 Erro": vk11["error"],
                    "ZAJU Sucesso": zaju["success"],
                    "ZAJU Pendente": zaju["pending"],
                    "ZAJU Erro": zaju["error"],
                    "ZVER Sucesso": zver["success"],
                    "ZVER Pendente": zver["pending"],
                    "ZVER Erro": zver["error"]
                }]),
                "Inconst_SellIn": pd.DataFrame(sellin_det) if sellin_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_Clientes": pd.DataFrame(clientes_det) if clientes_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_Produtos": pd.DataFrame(produtos_det) if produtos_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_Cutoff": pd.DataFrame(cutoff_det) if cutoff_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_Usuarios": pd.DataFrame(usuarios_det) if usuarios_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_Pagamentos": pd.DataFrame(pagamentos_det) if pagamentos_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_ZAJU": pd.DataFrame(zaju_erros_det) if zaju_erros_det else pd.DataFrame([{"Aviso": "Sem dados"}]),
                "Inconst_VK11": pd.DataFrame(vk11_erros_det) if vk11_erros_det else pd.DataFrame([{"Aviso": "Sem dados"}])
            }

            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
                for sheet_name, df in dfs.items():
                    df.to_excel(writer, index=False, sheet_name=sheet_name)
                    apply_excel_premium_style(writer, sheet_name)

            excel_bytes = excel_buffer.getvalue()

            # 4. Montar Resumo
            meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
            periodo_nome = f"{meses[start_dt.month]} {start_dt.year}"
            arquivo_nome = f"Inconsistencias_{meses[start_dt.month]}_{start_dt.year}.xlsx"

            allowed_sync_cats = ["SELLIN", "CUTOFF", "PRODUTO", "CLIENTE", "PAGAMENTO_LIQUIDADO", "PRE_CADASTRO_USUARIO"]
            filtered_last_sync = [r for r in last_sync_res if r["categoria"] in allowed_sync_cats]

            promo_types = ['ZAJU_AJUSTE_VERBA_PERC', 'ZAJU_AJUSTE_VERBA_NOMI', 'ZAJU_CUTOFF_MES_ANTERIOR', 'ZAJU_CUTOFF_MES_CORRENTE']
            contrato_types = ['ZAJU_AJUSTE_VERBA_CONTRATO_NOMI', 'ZAJU_AJUSTE_VERBA_CT_PERC_CRE', 'ZAJU_AJUSTE_VERBA_CT_PERC_COM', 'ZAJU_AJUSTE_VERBA_CT_PERC_LOG']
            acordos_types = ['ZAJU_AJUSTE_PGTO', 'ZAJU_APUR_REPROVADA', 'ZAJU_PGTO_REPROVADO', 'ZAJU_AJUSTE_DEV_OFF']

            summary_data = {
                "periodo": periodo_nome,
                "vk11": vk11,
                "zaju": {
                    "total_integrado": zaju["success"],
                    "total_pendente": zaju["pending"],
                    "total_erro": zaju["error"],
                    "total_retorno": zaju["pending_return"],
                    "detalhamento_sucesso": {i["type"]: i["success"] for i in zaju_details if i["success"] > 0},
                    "detalhamento_pendentes": {
                        "Verba Promo & Ações": {i["type"]: i["pending"] for i in zaju_details if i["pending"] > 0 and i["type"] in promo_types},
                        "Verbas de contrato": {i["type"]: i["pending"] for i in zaju_details if i["pending"] > 0 and i["type"] in contrato_types},
                        "Acordos": {i["type"]: i["pending"] for i in zaju_details if i["pending"] > 0 and i["type"] in acordos_types}
                    },
                    "detalhamento_erros": {i["type"]: i["error"] for i in zaju_details if i["error"] > 0},
                    "detalhamento_retorno": {i["type"]: i["pending_return"] for i in zaju_details if i["pending_return"] > 0}
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
                "last_sync": filtered_last_sync
            }

            # 5. Enviar E-mail
            await mail_service.send_operational_summary_email(email_to, summary_data, excel_bytes, arquivo_nome, cc_list=cc_list)
            
            # 6. Atualizar trava no banco
            async with AsyncSessionLocalApp() as db_app_update:
                await db_app_update.execute(
                    text("UPDATE notification_schedules SET last_run_at = :now WHERE id = :id"),
                    {"now": datetime.now(timezone('America/Sao_Paulo')), "id": schedule_id}
                )
                await db_app_update.commit()
                
        logger.info(f"Job de notificação operacional (ID: {schedule_id}) concluído com sucesso.")

    except Exception as e:
        logger.error(f"Erro ao processar job de notificação {schedule_id}: {e}")

async def heartbeat_job():
    logger.info(f"--- Scheduler Heartbeat: {datetime.now()} ---")

async def restart_scheduler():
    """
    Sincroniza os jobs do scheduler com o banco de dados.
    """
    logger.info("Sincronizando scheduler com banco de dados...")
    
    # Remover todos os jobs de cron existentes
    for job in scheduler.get_jobs():
        if job.id.startswith("notif_") or job.id == "heartbeat":
            scheduler.remove_job(job.id)
            
    # Adicionar heartbeat
    scheduler.add_job(heartbeat_job, 'interval', minutes=5, id='heartbeat', misfire_grace_time=300)
    logger.info("Job de Heartbeat (5min) configurado.")

    try:
        async with AsyncSessionLocalApp() as db_app:
            result = await db_app.execute(select(NotificationSchedule).where(NotificationSchedule.active == True))
            schedules = result.scalars().all()
            
            if not schedules:
                logger.info("Nenhum agendamento ativo encontrado no banco.")
                return

            for s in schedules:
                try:
                    # Garantir que o formato HH:MM seja respeitado
                    time_parts = s.time.split(":")
                    if len(time_parts) != 2:
                        logger.error(f"Formato de horário inválido (esperado HH:MM): {s.time} (ID: {s.id})")
                        continue
                        
                    hour, minute = time_parts
                    scheduler.add_job(
                        process_notification_job,
                        CronTrigger(hour=hour, minute=minute, timezone=timezone('America/Sao_Paulo')),
                        id=f"notif_{s.id}",
                        args=[s.id],
                        misfire_grace_time=600 # Reduzido para 10 minutos
                    )
                    logger.info(f"Agendamento ATIVADO: {s.time} (ID: {s.id})")
                except Exception as e:
                    logger.error(f"Erro ao adicionar job para {s.time}: {e}")
                    
    except Exception as e:
        logger.error(f"Erro ao sincronizar scheduler: {e}")
