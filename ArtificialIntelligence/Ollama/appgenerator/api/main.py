import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3:4b")
GENERATE_URL = f"{OLLAMA_HOST}/api/generate"

app = FastAPI(title="Prompt API", version="1.0.0")

# Allow the web app and local dev access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

class GenerateResponse(BaseModel):
    model: str
    response: str

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "ollama": OLLAMA_HOST}

@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
      # Non-streaming call to Ollama
      payload = {
          "model": MODEL_NAME,
          "prompt": req.prompt,
          "stream": False
      }
      print(GENERATE_URL);
      r = requests.post(GENERATE_URL, json=payload, timeout=600)
      if r.status_code != 200:
          raise HTTPException(status_code=502, detail=f"Ollama error {r.status_code}: {r.text}")
      data = r.json()
      # Ollama returns {"response": "...", "model": "...", ...}
      return GenerateResponse(model=data.get("model", MODEL_NAME), response=data.get("response", ""))
    except requests.exceptions.RequestException as e:
      raise HTTPException(status_code=504, detail=f"Ollama request failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=os.getenv("UVICORN_HOST", "0.0.0.0"),
        port=int(os.getenv("UVICORN_PORT", "8000")),
        workers=int(os.getenv("UVICORN_WORKERS", "1")),
    )
