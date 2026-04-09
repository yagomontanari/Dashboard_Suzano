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
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #0054A6; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Dashboard Suzano</h1>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        {content}
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777;">
                        <p style="margin: 0;">&copy; 2026 Suzano S.A. - Todos os direitos reservados.</p>
                        <p style="margin: 5px 0 0 0;">Este é um e-mail automático, por favor não responda.</p>
                    </div>
                </div>
            </body>
        </html>
        """

    async def send_welcome_email(self, email_to: str, nome: str):
        content = f"""
        <h2 style="color: #0054A6;">Olá, {nome}!</h2>
        <p>Recebemos sua solicitação de cadastro no <strong>Dashboard Suzano</strong>.</p>
        <p>Sua conta está em processo de análise técnica/comercial. Assim que um administrador aprovar seu acesso, você receberá um novo e-mail com suas credenciais temporárias.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 5px solid #0054A6; border-radius: 4px;">
            <strong>Status:</strong> Pendente de Aprovação
        </div>
        <p style="margin-top: 25px;">Obrigado por utilizar nosso portal!</p>
        """
        await self._send_html_email(email_to, "Solicitação de Acesso ao Dashboard Suzano", self._get_base_template(content))

    async def send_approval_email(self, email_to: str, nome: str, temp_password: str):
        content = f"""
        <h2 style="color: #76BC21;">Boas notícias, {nome}!</h2>
        <p>Seu acesso ao <strong>Dashboard Suzano</strong> foi aprovado com sucesso.</p>
        <p>Abaixo estão suas credenciais de acesso temporárias:</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f4fbf0; border: 1px dashed #76BC21; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">E-mail de Login:</p>
            <p style="margin: 5px 0 15px 0; font-size: 18px; font-weight: bold; color: #333;">{email_to}</p>
            <p style="margin: 0; font-size: 14px; color: #666;">Senha Temporária:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0054A6; letter-spacing: 2px;">{temp_password}</p>
        </div>
        <p style="color: #d9534f; font-weight: bold;">Importante: Você deverá alterar esta senha ao realizar o primeiro login.</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://dashboard-suzano.app" style="background-color: #0054A6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Portal</a>
        </div>
        """
        await self._send_html_email(email_to, "Acesso Liberado - Dashboard Suzano", self._get_base_template(content))

    async def send_reset_password_email(self, email_to: str, nome: str, temp_password: str):
        content = f"""
        <h2 style="color: #0054A6;">Recuperação de Senha</h2>
        <p>Olá, {nome}. Uma nova senha temporária foi gerada para sua conta no <strong>Dashboard Suzano</strong>.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Nova Senha Temporária:</p>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #d9534f; letter-spacing: 2px;">{temp_password}</p>
        </div>
        <p>Por segurança, você será solicitado a criar uma nova senha definitiva assim que fizer o login.</p>
        <p>Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.</p>
        """
        await self._send_html_email(email_to, "Nova Senha Gerada - Dashboard Suzano", self._get_base_template(content))

mail_service = MailService()
