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
