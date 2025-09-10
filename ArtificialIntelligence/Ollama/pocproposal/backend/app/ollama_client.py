import aiohttp
from typing import List, Dict, Any
from .settings import get_settings

settings = get_settings()

class OllamaClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or settings.ollama_host

    async def generate(self, prompt: str, model: str | None = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {"model": model or settings.llm_model, "prompt": prompt, "stream": False}
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=600) as r:
                r.raise_for_status()
                data = await r.json()
                return data.get("response", "")

    async def embeddings(self, text: str, model: str | None = None) -> List[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": model or settings.embed_model, "prompt": text}
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=300) as r:
                r.raise_for_status()
                data = await r.json()
                return data.get("embedding", [])
