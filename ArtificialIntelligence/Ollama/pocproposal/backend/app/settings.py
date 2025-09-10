from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://appuser:apppass@postgres:5432/recruitment_db"
    redis_url: str = "redis://redis:6379/0"
    minio_endpoint: str = "http://minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_bucket: str = "resumes"
    ollama_host: str = "http://ollama:11434"
    llm_model: str = "llama2"
    embed_model: str = "nomic-embed-text"
    jwt_secret: str = "dev_secret_change_me"
    cors_origin: str = "http://localhost:8080"

    class Config:
        env_prefix = ""
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()
