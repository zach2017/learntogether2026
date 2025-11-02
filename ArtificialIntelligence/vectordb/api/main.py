# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import requests, chromadb

OLLAMA = "http://host.docker.internal:11434"  # inside Docker
VECTOR = chromadb.HttpClient(host="chroma", port=8000)

app = FastAPI()
coll = VECTOR.get_or_create_collection("research-electric-patents")

class Ask(BaseModel):
    question: str
    top_k: int = 5

def retrieve(q, k):
    # embed the query
    e = requests.post(f"{OLLAMA}/api/embeddings", json={"model": "nomic-embed-text", "prompt": q}).json()["embedding"]
    res = coll.query(query_embeddings=[e], n_results=k, include=["documents", "metadatas", "distances", "ids"])
    # format
    contexts = []
    for i in range(len(res["ids"][0])):
        contexts.append({
          "id": res["ids"][0][i],
          "text": res["documents"][0][i],
          "meta": res["metadatas"][0][i],
          "score": 1 - res["distances"][0][i]
        })
    return contexts

SYSTEM = """You are a patent & research analyst. Cite sources with doc_id and chunk. 
Be precise. Prefer claim language and CPC references. If unsure, say so."""

def generate_answer(question, contexts):
    # Build a grounded prompt
    ctx = "\n\n---\n\n".join([f"[{c['id']}]\n{c['text']}" for c in contexts])
    prompt = f"""{SYSTEM}

Question: {question}

Context chunks:
{ctx}

Instructions:
- Use only the context to answer.
- Provide bullet points with doc_ids and CPC codes where relevant.
- End with a 'Trace' section listing the chunk ids you used.
"""
    r = requests.post(f"{OLLAMA}/api/generate", json={"model":"llama3.1:8b-instruct","prompt":prompt,"stream":False})
    return r.json()["response"]

@app.post("/ask")
def ask(req: Ask):
    ctx = retrieve(req.question, req.top_k)
    answer = generate_answer(req.question, ctx)
    return {"answer": answer, "contexts": ctx}
