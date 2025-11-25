**USAGE.md**  
```markdown
# RAG Keyword Extractor

## Prerequisites
1. Install Python 3.10+ from python.org.
2. Install Ollama from ollama.com (supports macOS, Linux, Windows).
3. Run `ollama pull nomic-embed-text` and `ollama pull llama3`.
4. Create a virtual environment: `python -m venv rag_env`.
5. Activate: `source rag_env/bin/activate` (Unix) or `rag_env\Scripts\activate` (Windows).
6. Install dependencies: `pip install -r requirements.txt`.
7. Create `doc.txt` with sample text (e.g., "AI improves with more data.").

## Run
```python
from rag_keywords import extract_matching_keywords

keywords = ["AI", "machine learning", "data", "model", "training"]
result = extract_matching_keywords("doc.txt", keywords)
print(result)
```

## Test
```bash
python -m pytest tests/
```
```


**requirements.txt**  
```txt
langchain==0.3.0
langchain-community==0.3.0
langchain-core==0.3.0
langchain-text-splitters==0.3.0
ollama==0.3.3
chromadb==0.5.3
```

---

**rag_keywords.py**  
```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser
import traceback

def extract_matching_keywords(doc_path: str, keywords: list, embed_model="nomic-embed-text", llm_model="llama3"):
    try:
        loader = TextLoader(doc_path)
        docs = loader.load()
    except FileNotFoundError:
        return "Error: Document not found."
    except Exception as e:
        return f"Error loading document: {e}"

    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=0)
    chunks = splitter.split_documents(docs)

    try:
        embeddings = OllamaEmbeddings(model=embed_model)
        vectorstore = Chroma.from_documents(chunks, embeddings, collection_name="temp")
        retriever = vectorstore.as_retriever()
    except Exception as e:
        return f"Error with embeddings/Chroma: {e}"

    template = f"""Extract keywords from this text that match: {', '.join(keywords)}.

Text: {{context}}

Matching keywords:"""
    prompt = PromptTemplate.from_template(template)

    llm = Ollama(model=llm_model)
    chain = (
        {"context": retriever}
        | prompt
        | llm
        | StrOutputParser()
    )

    try:
        return chain.invoke({})
    except Exception as e:
        return f"Error running chain: {e}"
```

---

**USAGE.md**  
```markdown
# RAG Keyword Extractor

## Setup
```bash
pip install -r requirements.txt
```

## Run
```python
from rag_keywords import extract_matching_keywords

keywords = ["AI", "machine learning", "data", "model", "training"]
result = extract_matching_keywords("doc.txt", keywords)
print(result)
```

## Test
```bash
python -m pytest tests/
```

---

**tests/test_rag.py**  
```python
from rag_keywords import extract_matching_keywords

def test_keywords_found(tmp_path):
    doc = tmp_path / "doc.txt"
    doc.write_text("AI is a model trained on data using machine learning.")
    keywords = ["AI", "machine learning", "data", "model", "training"]
    result = extract_matching_keywords(str(doc), keywords)
    assert "AI" in result
    assert "machine learning" in result

def test_no_match(tmp_path):
    doc = tmp_path / "doc.txt"
    doc.write_text("Cats are fluffy.")
    keywords = ["AI", "data"]
    result = extract_matching_keywords(str(doc), keywords)
    assert "AI" not in result
```

**tests/conftest.py** (empty, enables pytest)
```python
# pytest fixture support
```

**doc.txt** (example)
```
AI improves with more data. Machine learning models require training.
```