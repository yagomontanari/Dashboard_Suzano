from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import timedelta
import secrets
import string

from core.database_app import get_app_db
from core.models_app import User, UserRole, UserStatus, PasswordHistory
from core.security import (
    verify_password, 
    create_access_token, 
    get_password_hash, 
    validate_password_complexity,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import datetime
from core.mail import mail_service

router = APIRouter()

# --- SCHEMAS ---

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    must_change_password: bool

class LoginRequest(BaseModel):
    username: str # Será o e-mail
    password: str

class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    role: str
    status: str
    active: bool
    created_at: datetime
    must_change_password: bool

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    active: bool | None = None

class PasswordResetResponse(BaseModel):
    message: str

# --- HELPER ---

def generate_temp_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for i in range(length))

# --- ENDPOINTS ---

@router.post("/login", response_model=Token)
async def login(form_data: LoginRequest, db: AsyncSession = Depends(get_app_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not user.active:
        raise HTTPException(status_code=401, detail="Usuário inativo ou não encontrado")
    
    # 1. Verificar Bloqueio
    if user.locked_until and user.locked_until > datetime.utcnow():
        diff = user.locked_until - datetime.utcnow()
        minutes = int(diff.total_seconds() // 60)
        raise HTTPException(
            status_code=403, 
            detail=f"Conta bloqueada por {minutes} min devido a múltiplas tentativas falhas."
        )

    # 2. Verificar Senha
    if not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        # Incrementar falhas
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(hours=1)
            user.failed_login_attempts = 0 # Opcional: zerar após bloquear
            await db.commit()
            raise HTTPException(
                status_code=403, 
                detail="Conta bloqueada por 1 hora devido a múltiplas tentativas falhas."
            )
        await db.commit()
        raise HTTPException(status_code=401, detail="Senha incorreta")

    # 3. Zerar falhas em login OK
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # 4. Verificar Expiração (90 dias)
    # Se password_updated_at for None (migração), tratamos como OK e forçamos o update
    if user.password_updated_at:
        days_old = (datetime.utcnow() - user.password_updated_at).days
        if days_old >= 90:
            user.must_change_password = True
            await db.commit()
            # Retornamos token, mas avisamos que expirou via flag
            # (Opcional: raises 401 para o frontend tratar)
            # Vamos manter must_change_password para o redirecionamento existente

    await db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "must_change_password": user.must_change_password
    }

@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_app_db)):
    # Verifica se já existe
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este e-mail já possui uma solicitação ou cadastro.")

    new_user = User(
        nome=data.nome,
        email=data.email,
        status=UserStatus.PENDING,
        role=UserRole.CONSULTA,
        must_change_password=True
    )
    
    db.add(new_user)
    await db.commit()
    
    return {"message": "Solicitação enviada com sucesso! Aguarde a aprovação do administrador."}

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest, 
    token: str,
    db: AsyncSession = Depends(get_app_db)
):
    from core.security import SECRET_KEY, ALGORITHM
    from jose import jwt
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or (user.hashed_password and not verify_password(data.old_password, user.hashed_password)):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")

    # 1. Validar Complexidade
    complexity_error = validate_password_complexity(data.new_password, user.email)
    if complexity_error:
        raise HTTPException(status_code=400, detail=complexity_error)

    # 2. Validar Histórico (Últimas 12)
    hist_result = await db.execute(
        select(PasswordHistory)
        .where(PasswordHistory.user_id == user.id)
        .order_by(PasswordHistory.created_at.desc())
        .limit(12)
    )
    history_hashes = hist_result.scalars().all()
    
    for hist in history_hashes:
        if verify_password(data.new_password, hist.hashed_password):
            raise HTTPException(status_code=400, detail="A nova senha não pode ser igual às últimas 12 senhas utilizadas.")

    # 3. Salvar no Histórico antes de atualizar
    if user.hashed_password:
        new_history = PasswordHistory(user_id=user.id, hashed_password=user.hashed_password)
        db.add(new_history)

    # 4. Atualizar senha
    user.hashed_password = get_password_hash(data.new_password)
    user.must_change_password = False
    user.password_updated_at = datetime.utcnow()
    
    await db.commit()
    return {"message": "Senha alterada com sucesso!"}

# --- ADMIN ENDPOINTS ---

# Helper para validar admin
from api.data import get_current_user

async def check_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return user

@router.get("/admin/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users

@router.get("/admin/pending-count")
async def get_pending_count(
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(func.count(User.id)).where(User.status == UserStatus.PENDING))
    count = result.scalar() or 0
    return {"count": count}

@router.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, 
    data: UserUpdate, 
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Impedir auto-inativação
    if user.id == admin.id and data.active is False:
        raise HTTPException(status_code=400, detail="Você não pode inativar sua própria conta de administrador.")

    if data.nome is not None: user.nome = data.nome
    if data.email is not None: user.email = data.email
    if data.role is not None: user.role = data.role
    if data.active is not None: user.active = data.active
    
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/admin/users/{user_id}/approve")
async def approve_user(
    user_id: int, 
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    temp_pwd = generate_temp_password()
    user.hashed_password = get_password_hash(temp_pwd)
    user.status = UserStatus.APPROVED
    user.must_change_password = True
    user.active = True
    
    await db.commit()
    
    # Enviar email de aprovação com a senha temporária
    await mail_service.send_approval_email(user.email, user.nome, temp_pwd)
    
    return {
        "message": "Usuário aprovado e credenciais enviadas por e-mail!"
    }

@router.post("/admin/users/{user_id}/reject")
async def reject_user(
    user_id: int, 
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.status = UserStatus.REJECTED
        user.active = False
        await db.commit()
    return {"message": "Usuário reprovado."}

@router.post("/admin/users/{user_id}/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    user_id: int, 
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    temp_pwd = generate_temp_password()
    user.hashed_password = get_password_hash(temp_pwd)
    user.must_change_password = True
    
    await db.commit()
    
    # Enviar email de reset (ação do admin)
    await mail_service.send_reset_password_email(user.email, user.nome, temp_pwd)
    
    return {
        "message": "Senha resetada com sucesso e enviada ao usuário!"
    }

@router.post("/admin/users/{user_id}/unlock")
async def unlock_user(
    user_id: int, 
    db: AsyncSession = Depends(get_app_db),
    admin: User = Depends(check_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user.locked_until = None
    user.failed_login_attempts = 0
    await db.commit()
    
    # (Opcional) Notificar usuário do desbloqueio se quiser
    
    return {"message": "Usuário desbloqueado com sucesso!"}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_app_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    # Por segurança, mesmo que o usuário não exista, não informamos.
    if not user or not user.active:
        return {"message": "Se o e-mail estiver cadastrado, uma nova senha será enviada."}
    
    temp_pwd = generate_temp_password()
    user.hashed_password = get_password_hash(temp_pwd)
    user.must_change_password = True
    
    await db.commit()
    
    # Enviar email de reset
    await mail_service.send_reset_password_email(user.email, user.nome, temp_pwd)
    
    return {"message": "Uma nova senha temporária foi enviada para o seu e-mail."}
