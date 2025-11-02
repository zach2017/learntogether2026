Here’s a practical, end-to-end tutorial for building a research-intelligence solution that pulls patent/technical data from many sources and lets researchers analyze it with **Ollama**, **RAG (Retrieval-Augmented Generation)**, and **MCP (Model Context Protocol)**. It’s written so you can copy-paste your way to a working prototype, then harden it for real projects.

---

# 1) What you’ll build

A local-first stack that:

* **Ingests** patent + research data (patent filings, citations, prior art, papers, grants, standards, labs, companies).
* **Indexes** it (chunking + embeddings → vector store; plus a relational “facts” layer).
* **Answers questions** using a **RAG** pipeline powered by **Ollama** models (local LLM + local embeddings).
* **Calls live tools** via **MCP** to fetch/refresh data on demand (e.g., “find newest continuations in CPC H02J”).
* **Produces outputs** for (a) researchers (deep dives, novelty/risk analysis) and (b) sponsors (executive landscape briefs, KPIs).

---

# 2) Typical data sources

(Use what you have access to—start small, add connectors later.)

**Patents**

* USPTO bulk data, PatentsView API, EPO/OPS, WIPO, Google Patents (scraped with care to terms).
* Fields: application #, assignee, inventors, CPC/IPC, priority date, claims, citations (forward/backward), legal status.

**Papers / Standards / Grants**

* arXiv/IEEE/ACM (metadata + abstracts), NIST/ISO/IEC standards, NIH/NSF grants, EU CORDIS.
* Fields: DOI/ID, title, authors/affiliations, venue, abstract, keywords, year, grant amounts, PI/lab.

**Company / Market Signals (optional)**

* Crunchbase-like profiles, press releases, conference talks, job postings mentioning specific tech.

> You don’t need everything on day 1. Start with USPTO + arXiv metadata + one standards body.

---

# 3) Reference architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           USERS                                   │
│  Researchers (deep analysis)         Sponsors (exec briefings)    │
└───────────────────▲───────────────────────────────────────▲───────┘
                    │                                       │
             ┌──────┴───────────┐                     ┌─────┴───────┐
             │  RAG Orchestrator│  ← JSON over HTTP → │  Web/API UI │
             └──────▲────▲──────┘                     └──────────────┘
                    │    │
                    │    ├──► MCP Tools (live calls): patents_search, papers_search,
                    │           standards_lookup, grant_lookup, company_lookup
                    │
                    ├──► Vector DB (embeddings)  ── chunk text → embed → similarity search
                    │
                    └──► SQL/Graph DB (facts)    ── metadata, citations, CPC trees, KPI tables
                              ▲
                              │
                   Ingestion Pipelines (batch/cron + on-demand MCP fetchers)
                              │
                      Raw Sources (files/APIs)
```

---

# 4) Local setup (Ollama + Vector DB + API)

## 4.1 Prerequisites

* Docker / Docker Compose
* Git, Python 3.11+ (for ETL scripts)
* Node 18+ (if you want a small UI)
* **Ollama** installed locally

## 4.2 Choose models (pull once)

```bash
# Core reasoning model (choose one that runs well on your machine)
ollama pull llama3.1:8b-instruct
# Or: ollama pull qwen2.5:7b-instruct

# Embedding model
ollama pull nomic-embed-text
# Alternatives that run with Ollama: bge-m3, mxbai-embed-large, etc.
```

## 4.3 Docker Compose (vector + pg, optional UI)

```yaml
# docker-compose.yml
services:
  pg:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  # Chroma is the lightest to start; swap for pgvector/qdrant later
  chroma:
    image: chromadb/chroma:latest
    ports: ["8000:8000"]
    environment:
      CHROMA_SERVER_HOST: 0.0.0.0
      CHROMA_SERVER_HTTP_PORT: 8000

  api:
    build: ./api
    environment:
      OLLAMA_BASE_URL: http://host.docker.internal:11434
      VECTOR_URL: http://chroma:8000
      PG_URL: postgresql://postgres:postgres@pg:5432/postgres
    ports: ["8080:8080"]
    depends_on: [pg, chroma]

volumes:
  pgdata:
```

> **Why Chroma first?** Easy, no external dependency. For scale and strong SQL joins, move to **Postgres + pgvector** and use PG both for vectors and facts.

---

# 5) Data model & metadata

## 5.1 Shared metadata (JSON)

```json
{
  "source": "USPTO",
  "doc_type": "patent",
  "doc_id": "US-20240123456-A1",
  "title": "Bidirectional DC-DC Converter...",
  "assignees": ["ACME Energy Systems"],
  "inventors": ["Jane Doe", "John Smith"],
  "cpc": ["H02J7/00", "H02M3/158"],
  "priority_date": "2023-04-11",
  "pub_date": "2024-05-15",
  "citations_backward": ["US-20190123456-A1", "WO-2018123456-A1"],
  "citations_forward": [],
  "abstract": "A topology for ...",
  "claims_text": "1. A converter comprising ...",
  "full_text_uri": "s3://bucket/uspto/US20240123456.txt",
  "cleaned_text": "A topology for bidirectional ... (body text)",
  "embedding_model": "nomic-embed-text",
  "chunker": "semantic:400-800tok",
  "checksum": "sha256:...",
  "version": 1
}
```

## 5.2 Facts layer (SQL)

* `patents(doc_id PRIMARY KEY, title, pub_date, priority_date, assignees[], cpc[], has_grant BOOLEAN, legal_status TEXT, ...)`
* `citations(from_id, to_id, type)`  (type = backward/forward/non-patent)
* `papers(doi PRIMARY KEY, year, authors[], venue, keywords[], url, abstract)`
* `grants(agency, program, id, pi, org, start_date, end_date, amount, keywords[])`

---

# 6) Ingestion pipeline (ETL)

> Keep it boring and testable: **extract** → **normalize** → **chunk** → **embed** → **upsert**.

### 6.1 Python: embedding via Ollama

```python
# etl/embed.py
import requests, json
OLLAMA = "http://localhost:11434"

def embed_text(text: str, model="nomic-embed-text"):
    r = requests.post(f"{OLLAMA}/api/embeddings", json={"model": model, "prompt": text})
    r.raise_for_status()
    return r.json()["embedding"]
```

### 6.2 Chunking (rule-of-thumb)

* **Semantic paragraphs**, target **400–800 tokens**.
* Keep **title + headers** with each chunk for better retrieval.
* Store `doc_id`, `chunk_id`, `chunk_text`, `embedding`, `metadata`.

### 6.3 Upsert into Chroma

```python
# etl/chroma_upsert.py
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(host="localhost", port=8000, settings=Settings(allow_reset=True))
coll = client.get_or_create_collection("research-electric-patents", metadata={"hnsw:space": "cosine"})

def upsert_chunk(doc_id, chunk_id, text, meta, vector):
    coll.upsert(
      ids=[f"{doc_id}:::{chunk_id}"],
      embeddings=[vector],
      documents=[text],
      metadatas=[meta]
    )
```

### 6.4 Loading sample USPTO text

Start with 50–100 docs to make the loop fast. Prove value, then scale.

---

# 7) RAG Orchestrator (simple FastAPI)

```python
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
```

Run with:

```bash
docker compose up --build
# then
curl -s -X POST localhost:8080/ask -H 'content-type: application/json' \
  -d '{"question":"What bidirectional DC-DC converter topologies appear in CPC H02M for EV battery systems since 2023?","top_k":6}' | jq -r '.answer'
```

---

# 8) MCP: live tool calls from the model

**Goal:** Let the LLM call **tools** (via MCP) to fetch/refresh data mid-conversation (e.g., “search recent continuations”, “get newest arXiv abstracts”, “pull legal status updates”).

### 8.1 Define a minimal MCP server

* Expose tools like `patents_search`, `papers_search`, `standards_lookup`.
* Each tool returns **small, structured JSON** (not raw HTML), which your RAG orchestrator can blend into answers.

**Example: simple MCP tool spec (TypeScript skeleton)**

```ts
// tools/patents_search.ts (MCP server)
import { Tool } from "@modelcontextprotocol/sdk"; // pseudo-import for illustration

export const patents_search: Tool = {
  name: "patents_search",
  description: "Search patents by CPC, date range, keywords; returns metadata list",
  inputSchema: {
    type: "object",
    properties: {
      cpc: { type: "string" },
      query: { type: "string" },
      from: { type: "string", description: "YYYY-MM-DD" },
      to: { type: "string" }
    },
    required: ["query"]
  },
  handler: async (input) => {
    // Call your source (e.g., PatentsView or your DB)
    // Return a small structured array (doc_id, title, pub_date, link)
    return {
      results: [
        { doc_id: "US20240123456A1", title: "Bidirectional DC-DC...", pub_date: "2024-05-15", cpc: ["H02M3/158"], link: "..." },
        // ...
      ]
    };
  }
};
```

Then wire your MCP server (Node/TS, Python, or Go) to your app and **register** tools the model is allowed to call. In your prompt/system message, describe how/when to call each tool.

> In VS Code (+MCP-capable client) you can also expose these tools to analysts, so they can run tool calls from their IDE and paste results back into reports.

---

# 9) Analyst & sponsor workflows (what they get)

### 9.1 For researchers (deep)

* **Landscape map** of sub-domains (CPC/IPC clusters, top assignees, trends since year N).
* **Novelty heat-check** (compare proposed idea vs. nearest claims; list overlapping limitations and unique elements).
* **Citation tracing** (backward & forward graphs; key prior art with claim snippets).
* **Standards alignment** (which ISO/IEC/NIST standards touch the topic).
* **Lab & funding view** (grants, PIs, timelines).
* **Benchmark pack**: nearest-neighbor docs, summarized claims, side-by-side tables, links.

### 9.2 For sponsors (executive)

* **One-page brief**: top players, velocity (filings/year), white-space opportunities by CPC, risk notes.
* **KPI dashboard**: # new filings (quarterly), # relevant grants, “time-to-novelty” score, top emerging terms.

---

# 10) Prompt patterns (copy/paste)

### 10.1 Researcher “novelty heat-check”

```
You are a patent analyst. Given the Proposed Concept and the Retrieved Context, 
produce: (1) Novelty signals (what appears unique), (2) Overlaps with citations 
(list claim limitations that match), (3) Risks & recommendations (cite doc_ids, chunks).

Proposed Concept:
<< paste short technical description >>

Retrieved Context (doc_id::chunk_id then text):
<< orchestrator injects top K RAG chunks here >>

Rules:
- Prefer claim language. Cite CPCs where possible.
- Be specific; include 1–2 quoted phrases per cited chunk.
```

### 10.2 Sponsor “exec brief”

```
Summarize the current landscape for <topic>, focusing on: top assignees, 
filing velocity since <year>, exemplar documents (3–5), early-stage labs, 
and white-space opportunities (CPC sub-classes with low activity but relevant).

End with a 5-bullet action list and a simple KPI table (metric | last Q | YoY%).
Ground all bullets with doc_ids or source tags.
```

---

# 11) Guardrails & quality

* **Grounding:** Always pass chunk IDs, doc_ids into prompts; require the model to list a **Trace** section.
* **Chunking:** Keep 400–800 tokens; add **title + CPC + dates** in chunk metadata.
* **Citations:** Force format `[doc_id:::chunk_n]`.
* **Hallucinations:** If no chunks meet a threshold score, tell the model to **ask for a tool call** (MCP) or say “insufficient evidence.”
* **Evaluation:** Keep a small gold-set (questions with known sources). Log:

  * Retrieval precision@k, coverage (% of gold sources retrieved).
  * Answer factuality (manual spot checks weekly).
* **PII/IP:** Store internal notes separately. Mark sponsor-safe exports.

---

# 12) Moving from prototype → production

* **Swap Chroma → Postgres/pgvector** for unified SQL + vectors and stronger consistency.
* **Add background jobs** (Celery/Sidekiq/Temporal) for nightly refresh (new filings, grants).
* **Observability:** Log every query, retrieved IDs, model version, and tool calls; add a replay button.
* **Access control:** Row-level security for embargoed docs; audit who saw what.
* **Caching:** Answer cache keyed by `(question, model, corpus_version)`.
* **Speed:** Precompute embeddings; store claim-only chunks in a separate “claims” index.

---

# 13) Example “one-afternoon” starter plan

1. **Spin up** Docker Compose and pull Ollama models.
2. **Load 50 patents** (TXT/JSON) + **50 arXiv abstracts** into the ETL.
3. **Embed & index** chunks in Chroma.
4. **Run the API** and try 5 realistic questions.
5. **Add one MCP tool**: `patents_search` that hits your SQL table or an API.
6. **Ship a PDF** with:

   * Exec brief (1 page)
   * Research annex (3–5 pages with citations + Trace)

---

# 14) Optional snippets you can reuse

### 14.1 Simple CLI to index a directory

```python
# etl/index_dir.py
import glob, json
from embed import embed_text
from chroma_upsert import upsert_chunk

def chunks(text, size=1800, overlap=200):
    words = text.split()
    i = 0
    while i < len(words):
        j = min(i + size, len(words))
        yield " ".join(words[i:j])
        i = j - overlap if j < len(words) else j

for path in glob.glob("data/uspto/*.json"):
    doc = json.load(open(path))
    body = doc["cleaned_text"]
    meta = {k: doc[k] for k in ("doc_id","title","cpc","pub_date","source")}
    for idx, ch in enumerate(chunks(body)):
        vec = embed_text(ch)
        upsert_chunk(doc["doc_id"], idx, ch, meta, vec)
```

### 14.2 “Explain a claim” query (analyst helper)

```bash
curl -s -X POST localhost:8080/ask \
 -H 'content-type: application/json' \
 -d '{"question":"Explain the novelty in claim 1 of US20240123456A1 vs its backward citations.","top_k":8}' \
 | jq -r '.answer'
```

---

# 15) What support the system provides (at a glance)

**For researchers**

* Rapid **prior-art triage** with citations & claim quotes
* **Comparative matrices** (claim elements vs. nearest docs)
* **Trend lines** (filings by CPC/year, top assignees, emerging terms)
* **Standards/grants alignment** to accelerate go/no-go decisions
* **Live pulls** (MCP) for latest status without rebuilding the index

**For sponsors**

* **Executive briefs** with KPIs and white-space recommendations
* **Portfolio-fit** snapshots (how a proposal fits existing IP)
* **Risk notes** (legal status, crowded areas) with transparent Trace
* **Progress tracking** (weekly deltas, response time, top leads)

---

