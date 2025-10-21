# Use Ollama as the base image so the Ollama server & models are available
FROM ollama/ollama:latest

# Install Python & dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# (Optional) Let the model be configurable at build/run
ARG MODEL=llama3.1
ENV OLLAMA_MODEL=${MODEL}

# Copy app files
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py /app/app.py
COPY keywords.json /app/keywords.json
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Pull a default model at build time (can be overridden at runtime)
# If you want to delay pulling until container start, comment this out.
RUN /bin/sh -lc "ollama pull ${OLLAMA_MODEL}"

# Expose FastAPI and Ollama ports
EXPOSE 8000 11434

# Start both Ollama server and FastAPI
CMD ["/app/start.sh"]
