from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import re

def validate_password_complexity(password: str, user_email: str) -> str | None:
    """
    Retorna uma mensagem de erro se a senha for inválida, senão None.
    """
    if len(password) < 12:
        return "A senha deve ter pelo menos 12 caracteres."
    
    if not re.search(r"[A-Z]", password):
        return "A senha deve conter pelo menos uma letra maiúscula."
    
    if not re.search(r"[a-z]", password):
        return "A senha deve conter pelo menos uma letra minúscula."
    
    if not re.search(r"\d", password):
        return "A senha deve conter pelo menos um número."
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "A senha deve conter pelo menos um caractere especial (ex: @, #, $)."
    
    # Verifica se o e-mail (ou parte dele antes do @) está na senha
    username_part = user_email.split("@")[0].lower()
    if username_part in password.lower():
        return "A senha não pode conter o seu nome de usuário."
    
    return None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
