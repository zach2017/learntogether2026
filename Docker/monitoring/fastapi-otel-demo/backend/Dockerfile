FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    opentelemetry-bootstrap -a install

COPY app ./app

EXPOSE 8000
CMD ["sh", "-c", "opentelemetry-instrument --metrics_exporter otlp --traces_exporter otlp uvicorn app.main:app --host 0.0.0.0 --port 8000"]
