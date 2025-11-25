# query_chroma_local.py
import chromadb
from chromadb.utils import embedding_functions

# Same local client + embedding function
client = chromadb.PersistentClient(path="./chroma_data")
ef = embedding_functions.OllamaEmbeddingFunction(
    model_name="nomic-embed-text",
    url="http://localhost:11434"
)
collection = client.get_collection(name="docs", embedding_function=ef)

# Query
results = collection.query(
    query_texts=["Is the Eiffel Tower in Paris?"],
    n_results=2
)

print("Relevant docs:")
for doc in results["documents"][0]:
    print("- ", doc)

# Update a document (replace content)
collection.update(
    ids=["doc2"],
    documents=["The Eiffel Tower is located in Paris, France. It was built in 1889."]
)

# Delete example
# collection.delete(ids=["doc1"])

# Add new document
collection.add(
    ids=["doc3"],
    documents=["Berlin is the capital of Germany."]
)

print("\nDB updated & queried successfully")