Got it! Below is a small, self-contained setup that runs **Ollama** and a **Python FastAPI** app in the same container. The API accepts a **multipart file upload**, reads your **known JSON keyword list** (included here for EMP research), sends the file’s text to Ollama with instructions to **select only the relevant keywords** from that list, and returns JSON.

---

# 📁 Project layout

```
emp-keywords-ollama/
├─ Dockerfile
├─ requirements.txt
├─ app.py
├─ keywords.json
└─ start.sh
```

---

# 🐳 Dockerfile

```dockerfile
# Use Ollama as the base image so the Ollama server & models are available
FROM ollama/ollama:latest

# Install Python & dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# (Optional) Let the model be configurable at build/run
ARG MODEL=llama3.1
ENV OLLAMA_MODEL=${MODEL}

# Copy app files
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py /app/app.py
COPY keywords.json /app/keywords.json
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Pull a default model at build time (can be overridden at runtime)
# If you want to delay pulling until container start, comment this out.
RUN /bin/sh -lc "ollama pull ${OLLAMA_MODEL}"

# Expose FastAPI and Ollama ports
EXPOSE 8000 11434

# Start both Ollama server and FastAPI
CMD ["/app/start.sh"]
```

---

# ▶️ start.sh

```bash
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
```

---

# 📦 requirements.txt

```text
fastapi==0.115.5
uvicorn[standard]==0.32.0
python-multipart==0.0.9
ollama==0.3.3
```

---

# 🧠 app.py (FastAPI frontend)

```python
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
```

---

# 📚 keywords.json (EMP research – generic, researcher-friendly)

> This provides both **category groupings** and a flat **all_keywords** array for easy matching.

```json
{
  "categories": [
    {
      "name": "Phenomena",
      "keywords": [
        "EMP",
        "HEMP",
        "E1 pulse",
        "E2 pulse",
        "E3 pulse",
        "IEMI",
        "HPM",
        "GMD",
        "geomagnetic storm",
        "CME",
        "space weather",
        "solar storm"
      ]
    },
    {
      "name": "Sources",
      "keywords": [
        "nuclear detonation",
        "non-nuclear EMP",
        "intentional electromagnetic interference",
        "directed energy",
        "high-altitude burst",
        "substorm",
        "solar flare"
      ]
    },
    {
      "name": "Standards & Guidance",
      "keywords": [
        "MIL-STD-188-125",
        "MIL-STD-461",
        "RS105",
        "RS103",
        "IEC 61000-4-25",
        "IEC 61000-5-10",
        "IEEE C62",
        "NERC TPL-007",
        "FCC Part 15",
        "NIST SP 800-82",
        "NISTIR 7628"
      ]
    },
    {
      "name": "Vulnerable Systems",
      "keywords": [
        "power grid",
        "bulk electric system",
        "transformer saturation",
        "SCADA",
        "ICS",
        "substation",
        "transmission line",
        "distribution feeder",
        "data center",
        "telecommunications",
        "satellite",
        "aviation",
        "medical devices",
        "transportation systems"
      ]
    },
    {
      "name": "Mitigation & Hardening",
      "keywords": [
        "Faraday cage",
        "shielded room",
        "shielding effectiveness",
        "EMI gasket",
        "copper mesh",
        "mu-metal",
        "bonding and grounding",
        "single-point ground",
        "surge arrester",
        "MOV",
        "TVS diode",
        "gas discharge tube",
        "line filter",
        "waveguide-beyond-cutoff",
        "point-of-entry protection",
        "lightning protection",
        "isolation transformer",
        "fiber isolation",
        "hardened enclosure"
      ]
    },
    {
      "name": "Modeling & Test",
      "keywords": [
        "vulnerability assessment",
        "risk assessment",
        "threat modeling",
        "coupling path",
        "field-to-wire coupling",
        "conducted susceptibility",
        "radiated susceptibility",
        "shielding attenuation",
        "radiated emissions",
        "time-domain simulation",
        "FDTD",
        "SPICE",
        "EM solver",
        "system-level testing",
        "site survey"
      ]
    },
    {
      "name": "Operational Resilience",
      "keywords": [
        "blackstart",
        "microgrid",
        "islanding",
        "critical load",
        "backup generation",
        "UPS",
        "battery energy storage",
        "generator hardening",
        "restoration plan",
        "situational awareness"
      ]
    },
    {
      "name": "Policy & Programs",
      "keywords": [
        "critical infrastructure",
        "sector risk management",
        "resilience planning",
        "cost-benefit analysis",
        "regulatory compliance",
        "supply chain risk",
        "public-private partnership"
      ]
    },
    {
      "name": "Research Types",
      "keywords": [
        "experimental",
        "bench testing",
        "field testing",
        "computational modeling",
        "simulation study",
        "materials research",
        "standards compliance testing",
        "red teaming",
        "forensics",
        "technology evaluation"
      ]
    },
    {
      "name": "Artifacts & Components",
      "keywords": [
        "PCB",
        "cable harness",
        "connector shielding",
        "filter topology",
        "choke",
        "ferrite",
        "enclosure resonance",
        "aperture leakage",
        "penetration panel",
        "feedthrough capacitor",
        "coax surge protector"
      ]
    }
  ],
  "all_keywords": [
    "EMP",
    "HEMP",
    "E1 pulse",
    "E2 pulse",
    "E3 pulse",
    "IEMI",
    "HPM",
    "GMD",
    "geomagnetic storm",
    "CME",
    "space weather",
    "solar storm",
    "nuclear detonation",
    "non-nuclear EMP",
    "intentional electromagnetic interference",
    "directed energy",
    "high-altitude burst",
    "substorm",
    "solar flare",
    "MIL-STD-188-125",
    "MIL-STD-461",
    "RS105",
    "RS103",
    "IEC 61000-4-25",
    "IEC 61000-5-10",
    "IEEE C62",
    "NERC TPL-007",
    "FCC Part 15",
    "NIST SP 800-82",
    "NISTIR 7628",
    "power grid",
    "bulk electric system",
    "transformer saturation",
    "SCADA",
    "ICS",
    "substation",
    "transmission line",
    "distribution feeder",
    "data center",
    "telecommunications",
    "satellite",
    "aviation",
    "medical devices",
    "transportation systems",
    "Faraday cage",
    "shielded room",
    "shielding effectiveness",
    "EMI gasket",
    "copper mesh",
    "mu-metal",
    "bonding and grounding",
    "single-point ground",
    "surge arrester",
    "MOV",
    "TVS diode",
    "gas discharge tube",
    "line filter",
    "waveguide-beyond-cutoff",
    "point-of-entry protection",
    "lightning protection",
    "isolation transformer",
    "fiber isolation",
    "hardened enclosure",
    "vulnerability assessment",
    "risk assessment",
    "threat modeling",
    "coupling path",
    "field-to-wire coupling",
    "conducted susceptibility",
    "radiated susceptibility",
    "shielding attenuation",
    "radiated emissions",
    "time-domain simulation",
    "FDTD",
    "SPICE",
    "EM solver",
    "system-level testing",
    "site survey",
    "blackstart",
    "microgrid",
    "islanding",
    "critical load",
    "backup generation",
    "UPS",
    "battery energy storage",
    "generator hardening",
    "restoration plan",
    "situational awareness",
    "critical infrastructure",
    "sector risk management",
    "resilience planning",
    "cost-benefit analysis",
    "regulatory compliance",
    "supply chain risk",
    "public-private partnership",
    "experimental",
    "bench testing",
    "field testing",
    "computational modeling",
    "simulation study",
    "materials research",
    "standards compliance testing",
    "red teaming",
    "forensics",
    "technology evaluation",
    "PCB",
    "cable harness",
    "connector shielding",
    "filter topology",
    "choke",
    "ferrite",
    "enclosure resonance",
    "aperture leakage",
    "penetration panel",
    "feedthrough capacitor",
    "coax surge protector"
  ]
}
```

---

# 🚀 Build & run

```bash
# 1) Build (you can pick a different model via --build-arg)
docker build -t emp-keywords-ollama --build-arg MODEL=llama3.1 .

# 2) Run
docker run --rm -p 8000:8000 -p 11434:11434 \
  -e OLLAMA_MODEL=llama3.1 \
  --name emp-kw \
  emp-keywords-ollama
```

> Tip: If you want to use a different model (e.g., `qwen2.5:7b` or `mistral-nemo`), set `-e OLLAMA_MODEL=...` and ensure it’s available via `ollama pull ...`.

---

# 🧪 Try it (example)

```bash
# Upload a text file and get matched keywords
curl -s -X POST "http://localhost:8000/extract_keywords" \
  -F "file=@/path/to/your/document.txt" | jq
```

Also available:

* `GET /health` – quick status
* `GET /keywords` – returns the keyword catalog you shipped with the container

---

## Notes & next steps

* **PDF/Docx support**: Add text extraction via `pdfminer.six` / `python-docx` if you’ll upload those formats frequently.
* **Rate limiting**: Consider adding a token bucket, especially if this will be public.
* **Strict JSON output**: The prompt already asks for a JSON array. The code also sanitizes and verifies that the final list is within your allowed set.
* **Custom keyword lists**: Swap `keywords.json` at build/runtime (mount a volume to `/app/keywords.json`) for different domains.


