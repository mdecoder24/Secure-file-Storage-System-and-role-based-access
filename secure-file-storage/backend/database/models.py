from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from datetime import datetime

# Fallback to sqlite if needed, but defining structures for PG
SQLALCHEMY_DATABASE_URL = "sqlite:///./secure_storage.db"
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgresserver/db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user") # admin, user, viewer

class File(Base):
    __tablename__ = "files"
    file_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_name = Column(String)
    owner_id = Column(String, ForeignKey("users.user_id"))
    encrypted_path = Column(String)
    encryption_key = Column(String) # Storing the key in DB as requested in PRD
    upload_date = Column(DateTime, default=datetime.utcnow)

class FilePermission(Base):
    __tablename__ = "file_permissions"
    permission_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String, ForeignKey("files.file_id"))
    user_id = Column(String, ForeignKey("users.user_id"))
    permission_type = Column(String) # view, download, edit

class Log(Base):
    __tablename__ = "logs"
    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
