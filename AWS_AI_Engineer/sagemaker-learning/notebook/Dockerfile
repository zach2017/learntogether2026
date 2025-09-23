# notebook/Dockerfile
FROM jupyter/scipy-notebook:latest

USER root

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

USER jovyan

# Install Python packages for SageMaker
RUN pip install --no-cache-dir \
    sagemaker \
    boto3 \
    scikit-learn \
    pandas \
    matplotlib \
    seaborn \
    joblib \
    xgboost \
    lightgbm \
    awscli-local

# Create directories
RUN mkdir -p /home/jovyan/work/examples \
             /home/jovyan/work/models \
             /home/jovyan/data


RUN ls -lR
# Set working directory
WORKDIR /home/jovyan/work

# Copy example notebooks if they exist
#COPY --chown=jovyan:users nodebook/examples ./examples/ 2>/dev/null || true

# Start Jupyter
CMD ["start-notebook.sh", "--NotebookApp.token=''", "--NotebookApp.password=''"]