#!/usr/bin/env python3
"""
Build embeddings from a list of text files and store them in a local Chroma DB.
"""

import argparse
import shutil
from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document  # ✅ FIXED import

def load_text_files(file_paths):
    docs = []
    for fp in file_paths:
        p = Path(fp).expanduser().resolve()
        if not p.exists() or not p.is_file():
            print(f"[WARN] Skipping missing file: {fp}")
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        docs.append(Document(page_content=text, metadata={"source": str(p)}))
    return docs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--files", nargs="+", required=True, help="List of .txt files")
    ap.add_argument("--persist", default="./chroma_db", help="Chroma persist dir")
    ap.add_argument("--collection", default="demo", help="Chroma collection name")
    ap.add_argument("--reset", action="store_true", help="Delete persist dir first")
    ap.add_argument("--chunk_size", type=int, default=800, help="Chunk size")
    ap.add_argument("--chunk_overlap", type=int, default=120, help="Chunk overlap")
    args = ap.parse_args()

    persist_dir = Path(args.persist)
    if args.reset and persist_dir.exists():
        print(f"[INFO] Resetting Chroma directory: {persist_dir}")
        shutil.rmtree(persist_dir)

    print("[INFO] Loading files…")
    raw_docs = load_text_files(args.files)
    if not raw_docs:
        print("[ERROR] No valid input files. Exiting.")
        return

    print("[INFO] Splitting into chunks…")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(raw_docs)
    print(f"[INFO] Total chunks: {len(chunks)}")

    print("[INFO] Initializing local embeddings (all-MiniLM-L6-v2)…")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    if persist_dir.exists():
        print("[INFO] Existing DB found. Adding documents…")
        vectordb = Chroma(
            persist_directory=str(persist_dir),
            collection_name=args.collection,
            embedding_function=embeddings,
        )
        vectordb.add_documents(chunks)
        vectordb.persist()
    else:
        print("[INFO] Creating new DB…")
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=str(persist_dir),
            collection_name=args.collection,
        ).persist()

    print(f"[DONE] Chroma DB ready at: {persist_dir} (collection: {args.collection})")

if __name__ == "__main__":
    main()
