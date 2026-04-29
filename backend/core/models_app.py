from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CONSULTA = "CONSULTA"

class UserStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CONSULTA)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING)
    must_change_password = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    
    # Novas políticas de segurança
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    password_updated_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com histórico (opcional, mas bom para organização)
    password_history = relationship("PasswordHistory", back_populates="user", cascade="all, delete-orphan")

class PasswordHistory(Base):
    __tablename__ = "password_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="password_history")

class NotificationRecipient(Base):
    __tablename__ = "notification_recipients"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NotificationSchedule(Base):
    __tablename__ = "notification_schedules"

    id = Column(Integer, primary_key=True, index=True)
    time = Column(String, nullable=False) # Formato HH:MM
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
