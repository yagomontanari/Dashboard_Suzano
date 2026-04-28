
from core.config import settings

print(f"SMTP_USER: {settings.SMTP_USER}")
print(f"SMTP_PASSWORD: {'SET' if settings.SMTP_PASSWORD else 'EMPTY'}")
print(f"SMTP_PORT: {settings.SMTP_PORT}")
