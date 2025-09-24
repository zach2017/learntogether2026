#!/bin/bash

echo "🚀 Starting Ollama with CORS enabled..."

# Set CORS environment variable
export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="0.0.0.0:11434"

echo "✅ CORS origins set to: $OLLAMA_ORIGINS"
echo "✅ Host set to: $OLLAMA_HOST"

# Start Ollama server
echo "🔄 Starting Ollama server..."
ollama serve &

# Wait for server to start
echo "⏳ Waiting for Ollama server to initialize..."
sleep 10

# Pull model if specified
if [ "$1" ]; then
    echo "📦 Pulling model: $1"
    ollama pull "$1"
else
    echo "📦 Pulling default model: qwen:4b"
    ollama pull qwen:4b
fi

echo "🎉 Ollama is ready!"
echo "🌐 Access your chat at: http://localhost:11434"
echo "🛑 Press Ctrl+C to stop"

# Keep the script running
wait