#!/usr/bin/env python3
import argparse
from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

try:
    from langchain_community.llms import Ollama
except Exception:
    Ollama = None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--persist", default="./chroma_db", help="Chroma persist dir")
    ap.add_argument("--collection", default="demo", help="Chroma collection name")
    ap.add_argument("--query", required=True, help="Natural-language query")
    ap.add_argument("--k", type=int, default=4, help="Top-k results to fetch")
    ap.add_argument("--ollama", default=None, help="Model name to use via Ollama (optional)")
    args = ap.parse_args()

    if args.ollama and Ollama is None:
        print("[WARN] Ollama not available; retrieval only.")

    persist_dir = Path(args.persist)
    if not persist_dir.exists():
        print("[ERROR] Persist dir not found. Run ingest.py first.")
        return

    print("[INFO] Loading Chroma DB…")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma(
        persist_directory=str(persist_dir),
        collection_name=args.collection,
        embedding_function=embeddings,
    )

    print(f"[INFO] Searching top-{args.k} for: {args.query!r}")
    docs = vectordb.similarity_search(args.query, k=args.k)

    print("\n=== Top Matches ===")
    for i, d in enumerate(docs, 1):
        src = d.metadata.get("source", "unknown")
        preview = d.page_content[:280].replace("\n", " ")
        print(f"[{i}] Source: {src}\n    {preview}...\n")

    if args.ollama and Ollama is not None:
        print(f"[INFO] Asking local LLM via Ollama: {args.ollama}")
        llm = Ollama(model=args.ollama)
        context = "\n\n".join([f"Source: {d.metadata.get('source','unknown')}\n{d.page_content}" for d in docs])
        prompt = (
            "You are a helpful assistant. Using only the CONTEXT below, answer the QUESTION clearly.\n\n"
            f"QUESTION:\n{args.query}\n\nCONTEXT:\n{context}\n\n"
            "If the answer cannot be found, say you don't know."
        )
        answer = llm.invoke(prompt)
        print("\n=== Answer ===")
        print(answer.strip())

if __name__ == "__main__":
    main()
