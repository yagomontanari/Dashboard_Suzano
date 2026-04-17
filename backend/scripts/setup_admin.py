import asyncio
import sys
import os

# Adiciona o diretório backend ao path para importar core
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.future import select
from core.database_app import AppSessionLocal
from core.models_app import User, UserRole, UserStatus
from core.security import get_password_hash

async def setup_admin():
    email = os.environ.get("ADMIN_INITIAL_EMAIL", "admin@suzano.com") 
    password = os.environ.get("ADMIN_INITIAL_PASSWORD")
    if not password:
        raise ValueError("ERRO CRÍTICO (Segurança): ADMIN_INITIAL_PASSWORD não foi definido nas variáveis de ambiente.")
    
    async with AppSessionLocal() as session:
        # Verifica se já existe
        result = await session.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"O usuário {email} já existe.")
            return

        print(f"Criando administrador inicial: {email}...")
        admin_user = User(
            nome="Administrador Suzano",
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
            must_change_password=True, # Força troca no primeiro login
            active=True
        )
        
        session.add(admin_user)
        await session.commit()
        print(f"Administrador criado com sucesso! Senha temporária: {password}")

if __name__ == "__main__":
    asyncio.run(setup_admin())
