import json
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from ollama import Client
import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

KEYWORDS_PATH = os.getenv("KEYWORDS_PATH", "keywords.json")

app = FastAPI(
    title="EMP Keyword Extractor",
    description="Upload a file; returns relevant keywords chosen strictly from a known list using an LLM.",
    version="1.0.0",
)

# Load keyword list at startup
def load_keywords() -> Dict[str, Any]:
    try:
        with open(KEYWORDS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Support both flat array and categorized structure
        if isinstance(data, dict) and "all_keywords" in data:
            return data
        elif isinstance(data, list):
            return {"categories": [{"name": "all", "keywords": data}],
                    "all_keywords": data}
        else:
            # Merge all categories to all_keywords
            all_kw = []
            for cat in data.get("categories", []):
                all_kw.extend(cat.get("keywords", []))
            data["all_keywords"] = sorted(set(all_kw))
            return data
    except Exception as e:
        raise RuntimeError(f"Failed to load keywords from {KEYWORDS_PATH}: {e}")

KEYWORDS_DB = load_keywords()

def read_file_as_text(upload: UploadFile) -> str:
    # Basic text read; extend for PDFs/Word if needed.
    raw = upload.file.read()
    if not raw:
        return ""
    # Try UTF-8 then fall back
    for enc in ("utf-8", "latin-1"):
        try:
            return raw.decode(enc, errors="ignore")
        except Exception:
            continue
    return raw.decode("utf-8", errors="ignore")

def build_prompt(doc_text: str, keyword_list: List[str]) -> str:
    # Keep the prompt deterministic; ask for strict JSON array
    return f"""
You are given:
1) A document's text content.
2) A fixed list of allowed keywords.

Your task: return ONLY the allowed keywords that are most relevant to the document.
Rules:
- Choose from the allowed keywords list ONLY. Do not invent new terms.
- Return a compact JSON array of strings (no explanations, no extra keys).
- Include both specific and broader terms when strongly implied.
- Prefer ≤ 25 items unless the document clearly justifies more.

Allowed keywords (JSON array):
{json.dumps(keyword_list, ensure_ascii=False)}

Document text (trimmed):
\"\"\"{doc_text[:12000]}\"\"\"
Output strictly as JSON array:
""".strip()

@app.get("/health")
def health():
    return {"status": "ok", "model": OLLAMA_MODEL, "ollama": OLLAMA_HOST}

@app.get("/keywords")
def get_keywords():
    return KEYWORDS_DB

@app.post("/extract_keywords")
async def extract_keywords(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    text = read_file_as_text(file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable as text")

    prompt = build_prompt(text, KEYWORDS_DB["all_keywords"])

    try:
        client = Client(host=OLLAMA_HOST)
        # Use generate for a single-shot prompt / response
        resp = client.generate(model=OLLAMA_MODEL, prompt=prompt)
        # Ollama returns { 'response': '...text...' }
        raw = resp.get("response", "").strip()

        # Try to parse the model output as JSON array
        parsed: Any = None
        try:
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                raise ValueError("Model did not return a JSON array")
        except Exception:
            # Try to extract a JSON array if the model wrapped it with text
            start = raw.find("[")
            end = raw.rfind("]")
            if start != -1 and end != -1 and end > start:
                parsed = json.loads(raw[start:end+1])
            else:
                raise

        # Deduplicate & validate that every item is within allowed list
        allowed = set(KEYWORDS_DB["all_keywords"])
        cleaned = []
        seen = set()
        for item in parsed:
            if isinstance(item, str):
                s = item.strip()
                if s in allowed and s not in seen:
                    cleaned.append(s)
                    seen.add(s)

        return JSONResponse(content={"keywords": cleaned})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama call failed: {e}")
