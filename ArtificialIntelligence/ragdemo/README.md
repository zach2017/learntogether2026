# 1) Create and activate a venv (recommended)
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2) Install deps
pip install -r requirements.txt

# 3) Prepare some .txt files (example)
mkdir -p docs
printf "Welcome to the demo.\nRefunds are processed within 7 days." > docs/policy.txt
printf "Meeting notes: prioritize onboarding and docs.\n" > docs/notes.txt

# 4) Build embeddings into a persistent Chroma store
python ingest.py --persist ./chroma_db --collection demo --files docs/policy.txt docs/notes.txt

# 5a) Retrieve similar chunks
python query.py --persist ./chroma_db --collection demo --query "How long do refunds take?"

# 5b) (Optional) Ask a local LLM via Ollama (if you have a model pulled)
# ollama pull llama3    # run once
python query.py --persist ./chroma_db --collection demo --query "Summarize the policy" --ollama llama3
