from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from .config import settings
import logging

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.EMAILS_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

import os
import tempfile

class MailService:
    def __init__(self):
        self.fm = FastMail(conf)

    async def _send_html_email(self, email_to: str, subject: str, body: str, attachments: list = []):
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body,
            subtype=MessageType.html,
            attachments=attachments
        )
        try:
            await self.fm.send_message(message)
            logger.info(f"Email enviado com sucesso para {email_to}")
        except Exception as e:
            logger.error(f"Email error for {email_to}: {e}")

    async def send_report_email(self, email_to: str, nome: str, report_name: str, file_content: bytes, filename: str, custom_period_text: str = None):
        import re
        mes_ref = ""
        meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        
        if custom_period_text:
            mes_ref = f" referente a {custom_period_text}"
        else:
            # Tenta extrair período inicial e final (ex: _20260101_20260331)
            match_duplo = re.search(r'_(\d{4})(\d{2})\d{2}_(\d{4})(\d{2})\d{2}', filename)
            if match_duplo:
                ano1, mes1, ano2, mes2 = match_duplo.groups()
                if ano1 == ano2:
                    if mes1 == mes2:
                        mes_ref = f" referente a <strong>{meses[int(mes1)]}/{ano1}</strong>"
                    else:
                        mes_ref = f" referente a <strong>{meses[int(mes1)]} a {meses[int(mes2)]}/{ano1}</strong>"
                else:
                    mes_ref = f" referente a <strong>{meses[int(mes1)]}/{ano1} a {meses[int(mes2)]}/{ano2}</strong>"
            else:
                match_simples = re.search(r'_(\d{4})(\d{2})\d{2}_?', filename)
                if match_simples:
                    ano, mes = match_simples.groups()
                    mes_ref = f" referente a <strong>{meses[int(mes)]}/{ano}</strong>"

        content = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Relatório Pronto!</h2>
            <p style="font-size: 16px; color: #64748b; margin: 0;">O arquivo que você solicitou{mes_ref} já foi gerado.</p>
        </div>
        <p>Olá, {nome.split()[0]}. O processamento do <strong>{report_name}</strong> foi concluído com sucesso.</p>
        <p>Você encontrará o arquivo em anexo neste e-mail (geralmente localizado no final desta mensagem ou no cabeçalho do seu provedor).</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 24px;">📄</div>
            <div>
                <p style="margin: 0; font-weight: 700; color: #0f172a; font-size: 14px;">{filename}</p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">Planilha Excel (XLSX)</p>
            </div>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 30px;">
            Dica: Se o relatório tiver muitas linhas, o download do anexo pode demorar alguns segundos dependendo da sua conexão.
        </p>
        """
        
        # Para evitar erros de tipo no fastapi-mail, salvamos em um arquivo temporário
        # e passamos o caminho para a biblioteca
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        with open(temp_path, "wb") as f:
            f.write(file_content)
            
        try:
            await self._send_html_email(
                email_to, 
                f"Relatório Disponível: {report_name}", 
                self._get_base_template(content),
                attachments=[temp_path]
            )
        finally:
            # Garante a limpeza do arquivo temporário após o envio
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def _get_base_template(self, content: str):
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        logo_tradelinks = f"{frontend_url}/logo/Tradelinks_Colorida.png"
        logo_magalu = f"{frontend_url}/logo/MGCS_Logo_Colorida.png"
        logo_suzano = f"{frontend_url}/logo/suzano-logo.png"

        return f"""
        <html>
            <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9;">
                <div style="max-width: 700px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background-color: #0f172a; padding: 40px 20px; text-align: center;">
                        <img src="{logo_suzano}" alt="Suzano" style="height: 45px; margin-bottom: 12px; display: inline-block;">
                        <div style="height: 1px; width: 40px; background-color: #334155; margin: 15px auto;"></div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; text-transform: uppercase;">Dashboard Suzano</h1>
                    </div>
                    
                    <!-- Content Body -->
                    <div style="padding: 40px 35px; background-color: #ffffff;">
                        {content}
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f8fafc; padding: 35px; text-align: center; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0 0 15px 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em;">Powered by</p>
                        <div style="text-align: center; margin-bottom: 10px;">
                            <img src="{logo_tradelinks}" alt="TradeLinks" style="height: 24px; margin: 0 10px; vertical-align: middle;">
                            <img src="{logo_magalu}" alt="Magalu Cloud" style="height: 24px; margin: 0 10px; vertical-align: middle;">
                        </div>
                        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                            <p style="margin: 0;">Este é um envio automático. Não é necessário responder.</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """

    async def send_welcome_email(self, email_to: str, nome: str):
        content = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 10px;">Olá, {nome.split()[0]}!</h2>
            <p style="font-size: 16px; color: #64748b; margin: 0;">Sua solicitação está em análise.</p>
        </div>
        <p style="margin-bottom: 20px;">Recebemos seu pedido de acesso ao portal corporativo. Nossa equipe administrativa validará seu perfil em breve.</p>
        <div style="padding: 20px; background-color: #f0f9ff; border-radius: 12px; text-align: center; border: 1px solid #e0f2fe;">
            <p style="margin: 0; font-weight: 700; color: #0284c7; font-size: 14px;">Status: AGUARDANDO APROVAÇÃO</p>
        </div>
        <p style="margin-top: 25px; font-size: 14px; text-align: center; color: #94a3b8;">Você receberá um novo e-mail assim que seu acesso for liberado.</p>
        """
        await self._send_html_email(email_to, "Solicitação de Acesso - Dashboard Suzano", self._get_base_template(content))

    async def send_approval_email(self, email_to: str, nome: str, temp_password: str):
        frontend_url = settings.FRONTEND_URL
        content = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Seja bem-vindo(a)!</h2>
            <p style="font-size: 16px; color: #64748b; margin: 0;">Seu acesso foi liberado com sucesso.</p>
        </div>
        <p style="text-align: center; margin-bottom: 25px;">Utilize as credenciais abaixo para seu primeiro login no portal:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <p style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0 0 5px 0;">Usuário / E-mail</p>
                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">{email_to}</p>
            </div>
            <div>
                <p style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0 0 5px 0;">Senha Temporária</p>
                <div style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 12px 25px; border-radius: 10px; font-family: 'Courier New', monospace; font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: 3px; margin-top: 5px;">
                    {temp_password}
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 35px;">
            <a href="{frontend_url}" style="background-color: #2563eb; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Entrar no Dashboard</a>
        </div>
        <p style="margin-top: 30px; font-size: 13px; text-align: center; color: #94a3b8;"><em>Dica: Você deverá trocar esta senha no primeiro acesso.</em></p>
        """
        await self._send_html_email(email_to, "Acesso Liberado - Dashboard Suzano", self._get_base_template(content))

    async def send_reset_password_email(self, email_to: str, nome: str, temp_password: str):
        frontend_url = settings.FRONTEND_URL
        content = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Recuperar Senha</h2>
            <p style="font-size: 16px; color: #64748b; margin: 0;">Uma nova senha foi gerada para você.</p>
        </div>
        <p style="text-align: center; margin-bottom: 25px;">Olá, {nome.split()[0]}. Confira abaixo seu código de acesso temporário:</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <p style="font-size: 12px; font-weight: 700; color: #ef4444; text-transform: uppercase; margin: 0 0 10px 0;">Sua Nova Senha</p>
            <div style="display: inline-block; background-color: #ffffff; border: 1px solid #fecdd3; padding: 15px 30px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 28px; font-weight: 800; color: #dc2626; letter-spacing: 4px;">
                {temp_password}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 35px;">
            <a href="{frontend_url}" style="background-color: #0f172a; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block;">Redefinir Agora</a>
        </div>
        <p style="margin-top: 30px; font-size: 13px; text-align: center; color: #94a3b8;">Se você não solicitou este reset, ignore este e-mail ou contate o suporte.</p>
        """
        await self._send_html_email(email_to, "Recuperação de Senha - Dashboard Suzano", self._get_base_template(content))

mail_service = MailService()
