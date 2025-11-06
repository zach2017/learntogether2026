```python
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_core.output_parsers import StrOutputParser

# Load document
loader = TextLoader("doc.txt")
docs = loader.load()

# Split
splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=0)
chunks = splitter.split_documents(docs)

# Embed & store
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = FAISS.from_documents(chunks, embeddings)
retriever = vectorstore.as_retriever()

# Known keywords
keywords = ["AI", "machine learning", "data", "model", "training"]

# Prompt
template = f"""Extract keywords from this text that match: {', '.join(keywords)}.

Text: {{context}}

Matching keywords:"""
prompt = PromptTemplate.from_template(template)

# Chain
llm = Ollama(model="llama3")
chain = (
    {"context": retriever}
    | prompt
    | llm
    | StrOutputParser()
)

# Run
result = chain.invoke({})
print(result)
```