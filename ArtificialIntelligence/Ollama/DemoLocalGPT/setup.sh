#!/bin/bash

echo "Starting Ollama with Docker Compose..."
docker-compose up -d ollama

echo "Waiting for Ollama server to be ready..."
until docker exec ollama curl -f http://localhost:11434/api/tags >/dev/null 2>&1; do
  echo "Waiting for Ollama server..."
  sleep 5
done

echo "Ollama server is ready. Pulling qwen3-coder model..."
docker exec ollama ollama pull qwen3-coder

echo "Model pull completed!"
echo "Ollama is now running and accessible at http://localhost:11434"