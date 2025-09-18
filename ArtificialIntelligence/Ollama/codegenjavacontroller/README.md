Awesome—here’s a clean, batteries-included setup: Docker Compose spins up **Ollama** (prepped with a custom “qwen3.8b-spring” model tuned to only emit Java Spring REST controllers in JSON) and a **Flask** web app with a tiny form that sends prompts and shows the JSON it gets back.

# Folder layout

```
ollama-spring/
├─ docker-compose.yml
├─ ollama/
│  └─ Modelfile
└─ web/
   ├─ Dockerfile
   ├─ requirements.txt
   ├─ app.py
   └─ templates/
      └─ index.html
```

---

## 1) `docker-compose.yml`

```yaml
version: "3.8"

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    environment:
      # Keep server warm for faster responses
      - OLLAMA_KEEP_ALIVE=5m
    volumes:
      - ollama-data:/root/.ollama
      - ./ollama/Modelfile:/models/Modelfile:ro
    healthcheck:
      test: ["CMD", "bash", "-lc", "curl -sf http://localhost:11434/api/tags > /dev/null"]
      interval: 10s
      timeout: 5s
      retries: 10

  web:
    build:
      context: ./web
    container_name: flask-web
    environment:
      - OLLAMA_HOST=http://ollama:11434
      # Name of the custom model we create from the Modelfile
      - OLLAMA_MODEL=qwen3.8b-spring
    depends_on:
      ollama:
        condition: service_healthy
    ports:
      - "8080:8080"

volumes:
  ollama-data:
```

> Notes
> • We’ll create a custom model named `qwen3.8b-spring` from the Modelfile.
> • Under the hood we start from a \~3B Qwen coder base; the “3.8b” label is your project’s local model name.

---

## 2) `ollama/Modelfile`

This “locks” the assistant to **only** output Java Spring REST controllers and in **strict JSON**.

```dockerfile
# Base model: a compact Qwen coder model (closest ~3B family)
FROM qwen2.5-coder:3b

PARAMETER temperature 0.2
PARAMETER num_ctx 8192
PARAMETER top_p 0.9

# System rules: ONLY emit JSON describing a Java Spring REST controller.
SYSTEM """
You are a code generator that ONLY produces JSON for Java Spring Boot REST API controllers.

Hard rules:
1) Output MUST be strict JSON (no markdown fences, no commentary).
2) JSON schema:
{
  "controllerName": "string (PascalCase, ends with 'Controller')",
  "framework": "Spring Boot",
  "endpoints": [
    {
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/...",
      "description": "short purpose",
      "requestBody": "Java DTO or null",
      "responseBody": "Java DTO or primitive",
      "statusCodes": ["200", "201", "400", "404", "500"]
    }
  ],
  "code": "A COMPLETE compilable Java Spring controller class with imports, annotations, DTOs if trivial, and minimal service stub. No tests."
}

3) ONLY create Spring REST controllers. No non-Java content. No explanations.
4) Use idiomatic Spring Boot: @RestController, @RequestMapping, @GetMapping, etc.
5) Prefer DTOs and @Validated where appropriate. Include minimal @ExceptionHandler if needed.
6) No placeholders like 'TODO'. Provide working defaults.
7) Return JSON responses (@ResponseBody implicit).
"""

# Template ensures the assistant speaks JSON directly.
TEMPLATE """
{{- if .System }}{{ .System }}{{ end -}}
UserPrompt:
{{ .Prompt }}

AssistantJSON:
"""

# (Optional) Prompt selected stop tokens if the base supports it
```

---

## 3) Flask web app

### `web/requirements.txt`

```
flask==3.0.3
requests==2.32.3
```

### `web/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY templates ./templates

EXPOSE 8080
CMD ["python", "app.py"]
```

### `web/app.py`

```python
import os
import time
import json
import requests
from flask import Flask, render_template, request, jsonify

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3.8b-spring")

app = Flask(__name__)

def _wait_for_ollama(timeout=120):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=3)
            if r.ok:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False

def _ensure_model():
    # Pull base model referenced in the Modelfile (idempotent)
    requests.post(f"{OLLAMA_HOST}/api/pull", json={"name": "qwen2.5-coder:3b"})
    # Create our fine-tuned/system-prompted variant
    requests.post(
        f"{OLLAMA_HOST}/api/create",
        json={"name": MODEL_NAME, "modelfile": open("/models/Modelfile", "r").read()}
    )

@app.before_first_request
def bootstrap_model():
    if _wait_for_ollama():
        # Try create; if it exists, Ollama will just return quickly
        try:
            _ensure_model()
        except Exception:
            # If already created or any race condition, we ignore
            pass

@app.get("/")
def index():
    return render_template("index.html", model=MODEL_NAME)

@app.post("/api/generate")
def generate():
    user_prompt = request.form.get("prompt", "").strip()
    if not user_prompt:
        return jsonify({"error": "Prompt is required."}), 400

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "Follow the JSON schema strictly."},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False
    }

    try:
        r = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, timeout=120)
        r.raise_for_status()
        data = r.json()
        content = data.get("message", {}).get("content", "")
        # Try to parse the model's JSON (it should be strict JSON per system rules)
        try:
            parsed = json.loads(content)
            return jsonify(parsed)
        except json.JSONDecodeError:
            # If model violates rules, return raw text for debugging
            return jsonify({"raw": content, "warning": "Model returned non-JSON. Check system rules/prompt."}), 200
    except requests.HTTPError as e:
        return jsonify({"error": f"Ollama error: {e.response.text}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

### `web/templates/index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Spring Controller Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: system-ui, Arial, sans-serif; margin: 2rem; max-width: 900px; }
    textarea { width: 100%; height: 140px; }
    pre { background: #111; color: #eee; padding: 1rem; overflow: auto; }
    .row { display: flex; gap: 1rem; align-items: center; }
    .row > * { flex: 1; }
    button { padding: .6rem 1rem; }
    .hint { color: #555; font-size: .95rem; }
  </style>
</head>
<body>
  <h1>Java Spring Controller JSON Generator</h1>
  <p class="hint">
    Describe the REST API you want (entities, endpoints, validation, DTOs). The model will respond with strict JSON and a full Spring controller.
  </p>

  <form id="f">
    <label for="prompt">Prompt</label>
    <textarea id="prompt" name="prompt" placeholder="Example: Create a ProductController with CRUD endpoints under /api/products. Validate price &gt;= 0. Return ProductDTO."></textarea>
    <div class="row">
      <button type="submit">Generate JSON</button>
    </div>
  </form>

  <h2>Response</h2>
  <pre id="out">{}</pre>

  <script>
    const form = document.getElementById('f');
    const out = document.getElementById('out');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      out.textContent = 'Generating...';
      const fd = new FormData(form);
      const res = await fetch('/api/generate', { method:'POST', body: fd });
      const data = await res.json();
      out.textContent = JSON.stringify(data, null, 2);
    });
  </script>
</body>
</html>
```

---

## Run it

```bash
# from the ollama-spring/ directory
docker compose up --build
```

On first start, the Flask container will:

1. Wait for Ollama,
2. **Pull** `qwen2.5-coder:3b`,
3. **Create** the custom model `qwen3.8b-spring` using your Modelfile.

Open: **[http://localhost:8080](http://localhost:8080)**
Enter a spec like:

```
Create OrderController with CRUD at /api/orders. Use OrderDTO(id, customerEmail, total, items[]).
Validate email and total>=0. Include @ExceptionHandler for IllegalArgumentException.
```

You’ll get **strict JSON**:

```json
{
  "controllerName": "OrderController",
  "framework": "Spring Boot",
  "endpoints": [ ... ],
  "code": "import org.springframework.web.bind.annotation.*; ... public class OrderController { ... }"
}
```

---

## Optional: test via curl

```bash
curl -X POST -F "prompt=Create ProductController with CRUD at /api/products with price>=0" http://localhost:8080/api/generate
```

---

## Tips / adjustments

* **Model choice:** If you want a different Qwen variant (e.g., `qwen2.5:3b` vs `qwen2.5-coder:3b`), change the Modelfile’s `FROM` and the `pull` call in `app.py`.
* **Even stricter JSON:** You can harden the `TEMPLATE` to preface the assistant section with an opening `{`—but if the model ever adds text before it, JSON parsing will break. The current approach relies on the strong SYSTEM rules.
* **Bigger context or different style:** tune `PARAMETER num_ctx`, `temperature`, `top_p` in the Modelfile.
