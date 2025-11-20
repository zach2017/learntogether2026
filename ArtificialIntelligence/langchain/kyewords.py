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