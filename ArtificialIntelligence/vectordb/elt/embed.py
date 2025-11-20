# etl/embed.py
import requests, json
OLLAMA = "http://localhost:11434"

def embed_text(text: str, model="nomic-embed-text"):
    r = requests.post(f"{OLLAMA}/api/embeddings", json={"model": model, "prompt": text})
    r.raise_for_status()
    return r.json()["embedding"]
