from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from core.database_app import get_app_db
from api.data import get_current_user, get_current_user_optional
from core.models_app import NotificationRecipient, NotificationSchedule, UserRole, User
from core.config import settings

router = APIRouter()

# Schemas
class RecipientCreate(BaseModel):
    email: EmailStr

class RecipientResponse(BaseModel):
    id: int
    email: str
    active: bool

class ScheduleUpdate(BaseModel):
    times: List[str] # ["08:00", "16:00"]

# Endpoints
@router.get("/recipients", response_model=List[RecipientResponse])
async def get_recipients(
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    result = await db.execute(select(NotificationRecipient))
    return result.scalars().all()

@router.post("/recipients", response_model=RecipientResponse)
async def add_recipient(
    data: RecipientCreate,
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    recipient = NotificationRecipient(email=data.email)
    db.add(recipient)
    await db.commit()
    await db.refresh(recipient)
    return recipient

@router.delete("/recipients/{recipient_id}")
async def delete_recipient(
    recipient_id: int,
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    result = await db.execute(select(NotificationRecipient).where(NotificationRecipient.id == recipient_id))
    recipient = result.scalar_one_or_none()
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinatário não encontrado")
    
    await db.delete(recipient)
    await db.commit()
    return {"message": "Destinatário removido com sucesso"}

@router.get("/schedules")
async def get_schedules(
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    result = await db.execute(select(NotificationSchedule))
    return result.scalars().all()

@router.post("/schedules")
async def update_schedules(
    data: ScheduleUpdate,
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    # Limpar agendamentos atuais e adicionar novos
    await db.execute(text("DELETE FROM notification_schedules"))
    
    for t in data.times:
        schedule = NotificationSchedule(time=t)
        db.add(schedule)
    
    await db.commit()
    
    # Reiniciar scheduler se necessário (isso será tratado no scheduler.py futuramente)
    from core.scheduler import restart_scheduler
    await restart_scheduler()
    
    return {"message": "Agendamentos atualizados com sucesso"}

@router.post("/send-manual")
async def trigger_manual_notification(
    request: Request,
    db: AsyncSession = Depends(get_app_db),
    current_user: User = Depends(get_current_user_optional)
):
    # Verifica se é uma chamada autorizada via CRON_SECRET do Vercel ou via Usuário Admin
    auth_header = request.headers.get("Authorization")
    is_cron = auth_header == f"Bearer {settings.CRON_SECRET}" if settings.CRON_SECRET else False
    
    if not is_cron:
        if not current_user or current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Acesso restrito")
    
    from core.scheduler import process_notification_job
    # Em ambientes serverless (Vercel), aguardamos a execução síncrona
    await process_notification_job()
    
    return {"message": "Notificações processadas com sucesso!"}

from sqlalchemy import text
