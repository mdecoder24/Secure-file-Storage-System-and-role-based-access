import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://mock-supabase-url.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "mock-supabase-key")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()
