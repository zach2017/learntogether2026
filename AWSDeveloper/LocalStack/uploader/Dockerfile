FROM python:3.11-slim

WORKDIR /app

# Install runtime deps
RUN pip install --no-cache-dir boto3==1.34.162

COPY app.py /app/app.py

# Default command can be overridden by docker compose run
CMD ["python", "app.py", "--help"]
