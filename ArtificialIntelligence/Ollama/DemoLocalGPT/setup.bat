@echo off
setlocal enabledelayedexpansion

echo Starting Ollama with Docker Compose...
docker-compose up -d ollama

echo Waiting for Ollama server to be ready...

:server_ready
echo Ollama server is ready. Pulling qwen:4b model...
docker exec ollama ollama pull qwen:4b

echo Model pull completed!
echo Ollama is now running and accessible at http://localhost:11434

pause