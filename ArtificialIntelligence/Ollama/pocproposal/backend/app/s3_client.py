import aioboto3
from .settings import get_settings

settings = get_settings()

def get_s3():
    session = aioboto3.Session()
    return session.client(
        "s3",
        endpoint_url=settings.minio_endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
    )
