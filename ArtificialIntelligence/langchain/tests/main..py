from rag_keywords import extract_matching_keywords

keywords = ["AI", "machine learning", "data", "model", "training"]
result = extract_matching_keywords("doc.txt", keywords)
print(result)