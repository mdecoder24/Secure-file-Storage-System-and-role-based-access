from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user" # user, admin, viewer

class UserResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    email: str
    role: str

    model_config = {"from_attributes": True}

class FileMetadata(BaseModel):
    file_id: uuid.UUID
    file_name: str
    owner_id: uuid.UUID
    upload_date: datetime

class FileUploadResponse(BaseModel):
    success: bool
    file_metadata: FileMetadata
    message: str

class FileShareRequest(BaseModel):
    file_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    role: Optional[str] = None
    permission_type: str # read, download, edit
