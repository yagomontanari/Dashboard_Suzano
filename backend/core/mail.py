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

class MailService:
    def __init__(self):
        self.fm = FastMail(conf)

    async def _send_html_email(self, email_to: str, subject: str, body: str):
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body,
            subtype=MessageType.html
        )
        try:
            await self.fm.send_message(message)
            logger.info(f"Email enviado com sucesso para {email_to}")
        except Exception as e:
            logger.error(f"Erro ao enviar email para {email_to}: {e}")

    def _get_base_template(self, content: str):
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        logo_tradelinks = f"{frontend_url}/logo/Tradelinks_Colorida.png"
        logo_magalu = f"{frontend_url}/logo/MGCS_Logo_Colorida.png"
        logo_suzano = f"{frontend_url}/logo/suzano-logo.png"

        return f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <!-- Header -->
                    <div style="background-color: #0f172a; padding: 30px; text-align: center;">
                        <img src="{logo_suzano}" alt="Suzano" style="height: 40px; margin-bottom: 10px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; tracking-tight: -0.025em;">Dashboard Suzano</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px; background-color: #ffffff;">
                        {content}
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 30px; text-align: center;">
                        <p style="margin: 0 0 20px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Powered by</p>
                        <div style="display: inline-block; vertical-align: middle;">
                            <img src="{logo_tradelinks}" alt="TradeLinks" style="height: 30px; margin: 0 15px; vertical-align: middle;">
                            <img src="{logo_magalu}" alt="Magalu Cloud" style="height: 30px; margin: 0 15px; vertical-align: middle;">
                        </div>
                        <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
                            <p style="margin: 0;">&copy; 2026 Suzano S.A. - Todos os direitos reservados.</p>
                            <p style="margin: 5px 0 0 0;">Este é um e-mail automático do sistema, por favor não responda.</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """

    async def send_welcome_email(self, email_to: str, nome: str):
        content = f"""
        <h2 style="color: #0f172a; font-size: 24px;">Olá, {nome}!</h2>
        <p>Recebemos sua solicitação de acesso ao <strong>Dashboard Suzano</strong>.</p>
        <p>Nossa equipe administrativa analisará seu cadastro. Assim que aprovado, você receberá um e-mail de confirmação com suas credenciais de acesso.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; text-align: center;">
            <p style="margin: 0; font-weight: 700; color: #2563eb;">Status da Solicitação: PENDENTE</p>
        </div>
        """
        await self._send_html_email(email_to, "Solicitação de Acesso - Dashboard Suzano", self._get_base_template(content))

    async def send_approval_email(self, email_to: str, nome: str, temp_password: str):
        frontend_url = settings.FRONTEND_URL
        content = f"""
        <h2 style="color: #0f172a; font-size: 24px;">Boas notícias, {nome}!</h2>
        <p>Seu acesso ao <strong>Dashboard Suzano</strong> foi aprovado com sucesso.</p>
        <p>Use as credenciais temporárias abaixo para seu primeiro acesso:</p>
        <div style="margin: 30px 0; padding: 25px; background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">E-mail:</p>
            <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #0f172a;">{email_to}</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">Senha Temporária:</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #2563eb; letter-spacing: 2px;">{temp_password}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;"><em>Por segurança, você será solicitado a criar uma nova senha ao entrar.</em></p>
        <div style="margin-top: 40px; text-align: center;">
            <a href="{frontend_url}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block;">Acessar Portal Agora</a>
        </div>
        """
        await self._send_html_email(email_to, "Acesso Liberado - Dashboard Suzano", self._get_base_template(content))

    async def send_reset_password_email(self, email_to: str, nome: str, temp_password: str):
        frontend_url = settings.FRONTEND_URL
        content = f"""
        <h2 style="color: #0f172a; font-size: 24px;">Recuperação de Senha</h2>
        <p>Olá, {nome}. Conforme solicitado, geramos uma nova senha temporária para sua conta.</p>
        <div style="margin: 30px 0; padding: 25px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #e11d48;">Nova Senha Temporária:</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #e11d48; letter-spacing: 2px;">{temp_password}</p>
        </div>
        <p>Acesse o portal para redefinir sua senha definitiva:</p>
        <div style="margin-top: 40px; text-align: center;">
            <a href="{frontend_url}" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block;">Redefinir Senha</a>
        </div>
        """
        await self._send_html_email(email_to, "Nova Senha Gerada - Dashboard Suzano", self._get_base_template(content))

mail_service = MailService()
