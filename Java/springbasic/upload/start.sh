#!/usr/bin/env bash
set -euo pipefail

# Start Ollama server in background
nohup ollama serve >/var/log/ollama.log 2>&1 &

# Simple wait loop for Ollama port to be ready
echo "Waiting for Ollama to be ready on :11434 ..."
for i in {1..60}; do
  if nc -z localhost 11434 2>/dev/null; then
    echo "Ollama is up."
    break
  fi
  sleep 1
done

# Ensure requested model is present (safe if already pulled)
if [[ -n "${OLLAMA_MODEL:-}" ]]; then
  echo "Ensuring model ${OLLAMA_MODEL} is available..."
  ollama pull "${OLLAMA_MODEL}" || true
fi

# Start the FastAPI app
exec uvicorn app:app --host 0.0.0.0 --port 8000
