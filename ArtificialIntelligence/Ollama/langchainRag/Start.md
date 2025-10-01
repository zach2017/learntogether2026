### Dockerfile for Fine-Tuning (Axolotl + llama.cpp)
```dockerfile
FROM nvcr.io/nvidia/cuda:12.1.1-cudnn8-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y git python3 python3-pip build-essential cmake libopenblas-dev pkg-config wget

RUN pip install torch --index-url https://download.pytorch.org/whl/cu121
RUN pip install -U "transformers>=4.37.0" "datasets>=2.16.0" "accelerate>=0.26.1" "peft>=0.7.1" "bitsandbytes>=0.41.3" "trl>=0.7.10" "safetensors>=0.4.1" "optimum>=1.16.2" "huggingface_hub>=0.20.3" "ninja" packaging flash-attn

RUN git clone https://github.com/OpenAccess-AI-Collective/axolotl /axolotl && cd /axolotl && pip install -e '.[flash-attn,deepspeed]'

RUN git clone https://github.com/ggerganov/llama.cpp /llama.cpp && cd /llama.cpp && make -j

WORKDIR /workspace
CMD ["bash"]
```

### Build and Run Fine-Tuning
1. `docker build -t finetune-env .`  
2. `docker run --gpus all -it -v $(pwd):/workspace finetune-env`  
3. Inside: Run Axolotl commands from example, then convert with llama.cpp.  
4. Exit and copy outputs.

### docker-compose.yml for RAG (Ollama + LangChain App)
```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - 11434:11434
    volumes:
      - ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  rag-app:
    build: .
    depends_on:
      - ollama
    volumes:
      - .:/app
    command: python rag.py  # Replace with your script name
volumes:
  ollama:
```

### Dockerfile for RAG App
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["python", "rag.py"]
```

### requirements.txt for RAG
```
langchain
langchain-community
faiss-cpu
pdfplumber
sentence-transformers
```

### Run RAG
1. Add rag.py from example.  
2. `ollama create mytinyllama -f Modelfile` (use GGUF from fine-tune).  
3. `docker compose up`.