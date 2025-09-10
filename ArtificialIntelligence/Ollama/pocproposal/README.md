# Recruitment Analysis POC (Local, Privacy-First)

A complete local POC for **recruitment analysis** using **Ollama** (local LLM inference), **FastAPI**, **PostgreSQL**, **Redis**, **MinIO**, **React (Vite + Tailwind)**, and **Nginx** — all via **Docker Compose**.

## Why this POC?
- **Cost-Effective:** Runs 100% locally (no cloud bills)
- **Privacy:** Data stays on your machine
- **Customizable:** Swap models, prompts, or extend modules easily
- **Prod Path:** Can migrate to Azure PaaS later (Azure OpenAI, Azure Postgres, Azure Cache for Redis, Azure Storage, Azure Front Door)
- **Responsive:** Async APIs and client-side streaming-ready UX

## Architecture
- **Ollama**: LLM + embeddings (e.g., `llama2`, `nomic-embed-text`)
- **FastAPI**: Async backend for analysis endpoints
- **PostgreSQL**: Structured storage (resumes, jobs, results)
- **Redis**: Caching for repeated queries
- **MinIO**: S3-compatible object store for documents
- **React + Tailwind**: Frontend UI
- **Nginx**: Reverse proxy routing `/api` → FastAPI and `/` → React

## Quickstart
```bash
git clone <this-zip-extract>
cd poc-recruitment-ollama-docker
cp .env.example .env   # edit if desired
docker compose up --build
```

- App: http://localhost:8080
- API: http://localhost:8080/api/docs
- MinIO Console: http://localhost:9001  (credentials in `.env`)

> First run will **pull models** (see `OLLAMA_MODELS` in `.env`). This may take a few minutes depending on model size.

## Core Modules
1. **Resume Analysis** – Extracts insights, scores, and key skills from a resume.
2. **Proposal Analysis** – Matches resumes to a proposal/job description and outputs fit factors.
3. **Skills Gap Analysis** – Compares candidate skills vs. target role requirements; outputs gaps & learning plan.
4. **What-If Scenarios** – Hypothetical capability changes (e.g., “What if candidate learns Kubernetes and Terraform?”).

See example requests in `backend/app/examples.http`.

## Dev Notes
- Prompts are in `backend/app/prompts.py` and easy to iterate
- Embeddings via Ollama → store/search in Postgres (simple POC table) or switch to pgvector later
- Replace LLM model env (`OLLAMA_MODELS`) for faster/smaller options
- CORS allowed origin is configurable via `.env`

## Production Path (Outline)
- Replace local services with Azure services (Azure Database for PostgreSQL, Azure Cache for Redis, Azure Blob Storage, Azure App Service / AKS, Azure Front Door)
- Add observability (OpenTelemetry, Prometheus/Grafana)
- Add auth (Keycloak or Azure AD) and RBAC
- Use **pgvector** for embeddings and semantic search at scale
- Background workers (Celery/RQ) for longer jobs
