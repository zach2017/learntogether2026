Here’s how to send a **multipart/form-data** file upload to **Ollama** from a Python FastAPI client or `requests` call.

---

## 🧠 Background

The Ollama API accepts requests at:

```
POST http://localhost:11434/api/generate
```

You can pass:

* A **model name**
* A **prompt**
* Optional **input data** (such as uploaded files)

Since Ollama’s API typically expects JSON, if you want to send files, you must wrap the request as **multipart/form-data**, with both your JSON prompt and file parts.

---

## ✅ Example using `requests` (client-side upload)

```python
import requests

url = "http://localhost:11434/api/generate"

# Open your file to send
file_path = "research.pdf"
files = {
    "file": open(file_path, "rb")
}

# JSON fields go in `data` or as a separate field
data = {
    "model": "llama3",
    "prompt": "Extract 5 keywords relevant to EMP research from this file."
}

response = requests.post(url, files=files, data=data)

print(response.text)
```

---

## ✅ Example using **FastAPI** (server that forwards upload to Ollama)

```python
from fastapi import FastAPI, File, UploadFile, Form
import requests

app = FastAPI()

@app.post("/analyze-file/")
async def analyze_file(
    model: str = Form("llama3"),
    prompt: str = Form("Extract keywords from this document"),
    file: UploadFile = File(...)
):
    files = {"file": (file.filename, await file.read(), file.content_type)}
    data = {"model": model, "prompt": prompt}
    
    # Forward to local Ollama API
    response = requests.post("http://localhost:11434/api/generate", files=files, data=data)
    return {"ollama_response": response.text}
```

---

## ✅ Example JSON keyword list (EMP research keywords)

You could also load a known list for your prompt:

```json
{
  "keywords": [
    "Electromagnetic Pulse",
    "EMP Shielding",
    "Faraday Cage",
    "Infrastructure Resilience",
    "Grid Hardening",
    "Directed Energy Weapons",
    "Power Systems",
    "Cyber-Physical Security",
    "Surge Protection",
    "Critical Infrastructure"
  ]
}
```

---

## 🔄 Example Ollama prompt with JSON reference

If your FastAPI app loads this `keywords.json`, you can embed it in the prompt before sending:

```python
import json

with open("keywords.json") as f:
    known_keywords = json.load(f)["keywords"]

prompt = f"""
Analyze this uploaded file and return only the keywords (from this list) that appear most relevant:
{', '.join(known_keywords)}
"""
```

Then send it as shown earlier.

---

Would you like me to extend this to also **save the Ollama result to a JSON file** (e.g., `/results/filename.json`) inside the container?
