FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uvicorn[standard] fastapi pydantic-settings==2.3.4     aiohttp httpx[http2] asyncpg sqlalchemy[asyncio] sqlalchemy-utils     redis>=5.0 aioboto3 boto3 python-multipart python-dotenv     tenacity

COPY ./app /app/app
COPY ./db /app/db

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
