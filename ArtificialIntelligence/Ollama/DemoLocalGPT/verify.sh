# Check if model is loaded
docker exec ollama-fastapi ollama list

# Test the API directly
curl http://localhost:11434/api/generate -d '{
  "model": "fastapi-generator",
  "prompt": "Create a simple FastAPI hello world"
}'