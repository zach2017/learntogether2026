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
