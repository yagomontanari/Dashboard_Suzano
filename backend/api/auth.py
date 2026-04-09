from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
import secrets
import string

from core.database_app import get_app_db
from core.models_app import User, UserRole, UserStatus
from core.security import (
    verify_password, 
    create_access_token, 
    get_password_hash, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

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

class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    role: str
    status: str
    created_at: str

    class Config:
        from_attributes = True

# --- HELPER ---

def generate_temp_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for i in range(length))

# --- ENDPOINTS ---

@router.post("/login", response_model=Token)
async def login(form_data: LoginRequest, db: AsyncSession = Depends(get_app_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    if user.status == UserStatus.PENDING:
        raise HTTPException(status_code=403, detail="Sua solicitação de acesso ainda está pendente de aprovação")
    
    if user.status == UserStatus.REJECTED:
        raise HTTPException(status_code=403, detail="Sua solicitação de acesso foi recusada.")

    if not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Senha incorreta")

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
    token: str, # Recebido no login
    db: AsyncSession = Depends(get_app_db)
):
    # Nota: Em produção, usaríamos o get_current_user, mas aqui simplificamos para o fluxo de primeiro acesso
    # Para segurança real, o usuário deve estar logado (mesmo com must_change_password: True)
    from core.security import SECRET_KEY, ALGORITHM
    from jose import jwt
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")
    
    user.hashed_password = get_password_hash(data.new_password)
    user.must_change_password = False
    await db.commit()
    
    return {"message": "Senha alterada com sucesso!"}

# --- ADMIN ENDPOINTS ---

@router.get("/admin/users")
async def list_users(db: AsyncSession = Depends(get_app_db)):
    # TODO: Adicionar verificação de admin aqui (get_current_user + role check)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users

@router.post("/admin/approve/{user_id}")
async def approve_user(user_id: int, db: AsyncSession = Depends(get_app_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    temp_pwd = generate_temp_password()
    user.hashed_password = get_password_hash(temp_pwd)
    user.status = UserStatus.APPROVED
    user.must_change_password = True
    
    await db.commit()
    
    # Retornamos a senha para que o Admin possa enviar manualmente (Já que não temos SMTP)
    return {
        "message": "Usuário aprovado!",
        "temporary_password": temp_pwd
    }

@router.post("/admin/reject/{user_id}")
async def reject_user(user_id: int, db: AsyncSession = Depends(get_app_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.status = UserStatus.REJECTED
        await db.commit()
    return {"message": "Usuário reprovado."}
