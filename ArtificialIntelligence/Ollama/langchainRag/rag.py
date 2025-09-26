# Install: pip install langchain langchain-community faiss-cpu pdfplumber
from langchain_community.document_loaders import PDFPlumberLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Load and split data
loader = PDFPlumberLoader("example.pdf")
docs = loader.load()
embedder = HuggingFaceEmbeddings()
splitter = SemanticChunker(embedder)
chunks = splitter.split_documents(docs)
vector = FAISS.from_documents(chunks, embedder)
retriever = vector.as_retriever(search_kwargs={"k": 3})

# LLM and chain
llm = Ollama(model="mytinyllama")
prompt = PromptTemplate.from_template("""Use context to answer: {context}\nQuestion: {question}""")
qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, chain_type_kwargs={"prompt": prompt})

# Query
print(qa.run("Your question?"))