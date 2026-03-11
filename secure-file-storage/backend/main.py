from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import timedelta
from typing import List
import os

from database.models import get_db, User, File, FilePermission, Log
from models.schemas import UserCreate, UserResponse, FileUploadResponse, FileMetadata, FileShareRequest
from config.settings import settings
from auth.jwt_utils import create_access_token, verify_token
from encryption.aes import generate_key, encrypt_file_data, decrypt_file_data

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI(title="Secure File Storage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

os.makedirs("storage_data", exist_ok=True)

def log_action(db: Session, user_id: str, action: str):
    new_log = Log(user_id=user_id, action=action)
    db.add(new_log)
    db.commit()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@app.post("/api/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = User(name=user.name, email=user.email, password_hash=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_action(db, new_user.user_id, "User registration")
    return new_user

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    log_action(db, user.user_id, "User login")
    return {"access_token": access_token, "token_type": "bearer", "user": {"user_id": user.user_id, "role": user.role, "name": user.name}}

@app.post("/api/upload")
async def upload_file(file: UploadFile = FastAPIFile(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file_data = await file.read()
    encryption_key = generate_key()
    encrypted_data = encrypt_file_data(file_data, encryption_key)
    
    # store file
    file_path = f"storage_data/{file.filename}_{current_user.user_id}.enc"
    with open(file_path, "wb") as f:
        f.write(encrypted_data)
        
    new_file = File(file_name=file.filename, owner_id=current_user.user_id, encrypted_path=file_path, encryption_key=encryption_key)
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    log_action(db, current_user.user_id, f"Uploaded file {file.filename}")
    return {"success": True, "file_id": new_file.file_id, "message": "File uploaded and encrypted"}

@app.get("/api/files")
def list_files(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        files = db.query(File).all()
    else:
        # files owned or shared
        owned = db.query(File).filter(File.owner_id == current_user.user_id).all()
        shared_perms = db.query(FilePermission).filter(FilePermission.user_id == current_user.user_id).all()
        shared_file_ids = [p.file_id for p in shared_perms]
        shared = db.query(File).filter(File.file_id.in_(shared_file_ids)).all()
        # unify uniqueness
        files = list({f.file_id: f for f in owned + shared}.values())
    
    return [ {"file_id": f.file_id, "file_name": f.file_name, "upload_date": f.upload_date, "owner_id": f.owner_id} for f in files ]

from fastapi.responses import StreamingResponse
import io

@app.get("/api/download/{file_id}")
def download_file(file_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file_record = db.query(File).filter(File.file_id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    has_access = False
    if current_user.role == "admin" or file_record.owner_id == current_user.user_id:
        has_access = True
    else:
        perm = db.query(FilePermission).filter(FilePermission.file_id == file_id, FilePermission.user_id == current_user.user_id, FilePermission.permission_type.in_(["view", "download", "edit"])).first()
        if perm:
            has_access = True
            
    if not has_access:
        log_action(db, current_user.user_id, f"Failed local download attempt for {file_record.file_name}")
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
        
    try:
        with open(file_record.encrypted_path, "rb") as f:
            encrypted_data = f.read()
    except Exception:
        raise HTTPException(status_code=500, detail="File corrupted or missing")
        
    decrypted_data = decrypt_file_data(encrypted_data, file_record.encryption_key)
    log_action(db, current_user.user_id, f"Downloaded file {file_record.file_name}")
    
    return StreamingResponse(io.BytesIO(decrypted_data), media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={file_record.file_name}"})

@app.post("/api/share")
def share_file(req: FileShareRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file_record = db.query(File).filter(File.file_id == str(req.file_id)).first()
    if not file_record or file_record.owner_id != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only owner or admin can share this file")
        
    perm = FilePermission(file_id=str(req.file_id), user_id=str(req.user_id), permission_type=req.permission_type)
    db.add(perm)
    db.commit()
    log_action(db, current_user.user_id, f"Shared file {file_record.file_name} with user {req.user_id}")
    return {"message": "File shared successfully"}

@app.get("/api/logs")
def get_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    logs = db.query(Log).order_by(Log.timestamp.desc()).all()
    # join with users to get names could be better but keeping simple
    res = []
    for log in logs:
        u = db.query(User).filter(User.user_id == log.user_id).first()
        res.append({
            "log_id": log.log_id,
            "action": log.action,
            "timestamp": log.timestamp,
            "user_name": u.name if u else "Unknown"
        })
    return res

@app.get("/api/users")
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    users = db.query(User).all()
    return [{"user_id": u.user_id, "name": u.name, "email": u.email, "role": u.role} for u in users]
