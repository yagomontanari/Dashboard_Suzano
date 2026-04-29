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
            
            # Lógica para separar destinatário principal e cópia
            # Se ninguém for marcado como is_primary, o primeiro da lista assume o "Para"
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
            zaju_erros_det = await fetch_data(db_metrics, QUERY_ERRO_ZAJU_LIST, params)
            vk11_erros_det = await fetch_data(db_metrics, QUERY_ERRO_VK11_LIST, params)

            # Processamento de DataFrames para o Excel
            zaju_df = pd.DataFrame(zaju_erros_det) if zaju_erros_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Ajustes (ZAJU) no período."}])
            if not zaju_df.empty and "Aviso" not in zaju_df.columns:
                zaju_df = zaju_df.rename(columns={
                    "mensagem_retorno_integracao": "Erro / Mensagem SAP",
                    "purch_no_c": "Tipo Integração",
                    "orcamento": "Orçamento",
                    "linha_investimento": "Linha de Investimento",
                    "tipo_linha_investimento": "Tipo de Linha",
                    "cod_cliente": "Cód. Cliente",
                    "nome_cliente": "Cliente",
                    "nro_nota_fiscal": "Nota Fiscal",
                    "nro_documento": "Doc. Faturamento",
                    "valor_bruto": "Valor Bruto",
                    "valor_liquido": "Valor Líquido",
                    "valor_provisao": "Valor Provisão",
                    "dta_criacao": "Data de Criação",
                    "status": "Status",
                    "data_integracao": "Data de Integração"
                })
                # Reorganizar colunas principais para o início
                cols_ord = ["Erro / Mensagem SAP", "Tipo Integração", "Orçamento", "Cliente", "Nota Fiscal", "Valor Provisão", "Status"]
                existing_cols = [c for c in cols_ord if c in zaju_df.columns]
                other_cols = [c for c in zaju_df.columns if c not in existing_cols]
                zaju_df = zaju_df[existing_cols + other_cols]

            vk11_df = pd.DataFrame(vk11_erros_det) if vk11_erros_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Orçamentos (VK11) no período."}])
            if not vk11_df.empty and "Aviso" not in vk11_df.columns:
                vk11_df = vk11_df.rename(columns={
                    "id_orcamento": "ID Orçamento",
                    "descricao": "Descrição",
                    "tipo_integracao": "Tipo de Integração",
                    "status": "Status",
                    "msg": "Erro / Mensagem SAP",
                    "valid_from": "Válido De"
                })
                # Reorganizar colunas principais para o início
                cols_ord_vk = ["Erro / Mensagem SAP", "ID Orçamento", "Descrição", "Tipo de Integração", "Status"]
                existing_cols_vk = [c for c in cols_ord_vk if c in vk11_df.columns]
                other_cols_vk = [c for c in vk11_df.columns if c not in existing_cols_vk]
                vk11_df = vk11_df[existing_cols_vk + other_cols_vk]

            # Criar os DataFrames
            dfs = {
                "Sell-In": pd.DataFrame(sellin_det) if sellin_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Sell-In no período."}]),
                "Clientes": pd.DataFrame(clientes_det) if clientes_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Clientes no período."}]),
                "Produtos": pd.DataFrame(produtos_det) if produtos_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Produtos no período."}]),
                "Cutoff": pd.DataFrame(cutoff_det) if cutoff_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Cutoff no período."}]),
                "Usuarios": pd.DataFrame(usuarios_det) if usuarios_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Usuários no período."}]),
                "Pagamentos": pd.DataFrame(pagamentos_det) if pagamentos_det else pd.DataFrame([{"Aviso": "Nenhuma inconsistência de Pagamentos no período."}]),
                "ZAJU": zaju_df,
                "VK11": vk11_df
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

            # Categorias permitidas para Últimos Registros Recebidos
            allowed_sync_cats = ["SELLIN", "CUTOFF", "PRODUTO", "CLIENTE", "PAGAMENTO_LIQUIDADO", "PRE_CADASTRO_USUARIO"]
            filtered_last_sync = [r for r in last_sync_res if r["categoria"] in allowed_sync_cats]

            # Tipos do ZAJU baseados no Frontend
            promo_types = ['ZAJU_AJUSTE_VERBA_PERC', 'ZAJU_AJUSTE_VERBA_NOMI', 'ZAJU_CUTOFF_MES_ANTERIOR', 'ZAJU_CUTOFF_MES_CORRENTE']
            contrato_types = ['ZAJU_AJUSTE_VERBA_CONTRATO_NOMI', 'ZAJU_AJUSTE_VERBA_CT_PERC_CRE', 'ZAJU_AJUSTE_VERBA_CT_PERC_COM', 'ZAJU_AJUSTE_VERBA_CT_PERC_LOG']
            acordos_types = ['ZAJU_AJUSTE_PGTO', 'ZAJU_APUR_REPROVADA', 'ZAJU_PGTO_REPROVADO', 'ZAJU_AJUSTE_DEV_OFF']

            # Detalhamentos Granulares por Tipo
            zaju_success_det = {i["type"]: i["success"] for i in zaju_details if i["success"] > 0}
            zaju_pending_det = {i["type"]: i["pending"] for i in zaju_details if i["pending"] > 0}
            zaju_error_det = {i["type"]: i["error"] for i in zaju_details if i["error"] > 0}
            zaju_return_det = {i["type"]: i["pending_return"] for i in zaju_details if i["pending_return"] > 0}

            # Agrupamento de Pendências (para manter a estrutura por categorias)
            zaju_pending_groups = {
                "Verba Promo & Ações": {k: v for k, v in zaju_pending_det.items() if k in promo_types},
                "Verbas de contrato": {k: v for k, v in zaju_pending_det.items() if k in contrato_types},
                "Acordos": {k: v for k, v in zaju_pending_det.items() if k in acordos_types}
            }

            summary_data = {
                "periodo": periodo_nome,
                "vk11": vk11,
                "zaju": {
                    "total_integrado": zaju["success"],
                    "total_pendente": zaju["pending"],
                    "total_erro": zaju["error"],
                    "total_retorno": zaju["pending_return"],
                    "detalhamento_sucesso": zaju_success_det,
                    "detalhamento_pendentes": zaju_pending_groups,
                    "detalhamento_erros": zaju_error_det,
                    "detalhamento_retorno": zaju_return_det
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

            # 5. Enviar E-mail único com CC para todos os interessados
            await mail_service.send_operational_summary_email(email_to, summary_data, excel_bytes, arquivo_nome, cc_list=cc_list)
                
        logger.info("Job de notificação operacional concluído com sucesso.")

    except Exception as e:
        logger.error(f"Erro ao processar job de notificação: {e}")

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
    scheduler.add_job(heartbeat_job, 'interval', minutes=5, id='heartbeat')
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
                        id=f"notif_{s.id}"
                    )
                    logger.info(f"Agendamento ATIVADO: {s.time} (ID: {s.id})")
                except Exception as e:
                    logger.error(f"Erro ao adicionar job para {s.time}: {e}")
                    
    except Exception as e:
        logger.error(f"Erro ao sincronizar scheduler: {e}")
