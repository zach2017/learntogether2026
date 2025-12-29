# rag_ollama_chroma.py - Full local RAG in one file
import chromadb
from chromadb.utils import embedding_functions
import ollama

# 1. Setup (run once)
client = chromadb.PersistentClient(path="./chroma_data")
ef = embedding_functions.OllamaEmbeddingFunction(
    model_name="nomic-embed-text",
    url="http://localhost:11434"
)
collection = client.get_or_create_collection("docs", embedding_function=ef)

# 2. Add some docs (only first run)
if collection.count() == 0:
    collection.add(
        ids=["doc1", "doc2", "doc3"],
        documents=[
            "Paris is the capital of France.",
            "The Eiffel Tower is in Paris, built in 1889.",
            "Berlin is the capital of Germany."
        ]
    )

# 3. Ask question → retrieve → ask Ollama
question = "Where is the Eiffel Tower and when was it built?"

results = collection.query(query_texts=[question], n_results=2)
context = "\n".join(results["documents"][0])

response = ollama.chat(model="tinyllama", messages=[
    {"role": "system", "content": "Answer using only the provided context. Be concise."},
    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
])

print("Answer →", response["message"]["content"])