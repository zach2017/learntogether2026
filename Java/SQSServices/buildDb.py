# save_to_chroma_local.py
import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./chroma_data")

ef = embedding_functions.OllamaEmbeddingFunction(
    model_name="nomic-embed-text",
    url="http://localhost:11434"
)

# Create/get collection
collection = client.get_or_create_collection(
    name="docs",
    embedding_function=ef
)

# Add documents
collection.add(
    documents=[
        "Paris is the capital of France.",
        "The Eiffel Tower is in Paris."
    ],
    ids=["doc1", "doc2"]
)

print("Documents saved to ./chroma_data")