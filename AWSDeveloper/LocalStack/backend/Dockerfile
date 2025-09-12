# backend/Dockerfile (Python version)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:3001", "--workers", "1", "--timeout", "120", "app:app"]