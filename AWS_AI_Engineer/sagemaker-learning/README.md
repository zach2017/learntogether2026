**LocalStack** - Simulates AWS services locally (S3, SageMaker, IAM)
- **MinIO** - S3-compatible object storage for data handling
- **Training Container** - Simulates SageMaker training jobs
- **Inference Container** - Model serving with SageMaker-compatible APIs

## What You Get:

**📊 Complete ML Pipeline:**
- Data preparation and exploration in Jupyter
- Model training following SageMaker conventions
- Model serving with REST API endpoints
- Local S3 storage simulation

**🛠️ Learning Features:**
- Sample training script (Random Forest classifier)
- Inference server with health checks
- Example notebook with step-by-step workflow
- Proper SageMaker directory structure (`/opt/ml/`)

**🔧 Development Benefits:**
- No AWS costs during learning
- Rapid iteration and testing
- Real SageMaker patterns and conventions
- Easy transition to actual AWS deployment


## Quick Start Commands:

```bash
# 1. Start core services
docker-compose up -d sagemaker-notebook localstack minio

# 2. Access Jupyter at http://localhost:8888

# 3. Train a model
docker-compose --profile training up sagemaker-training

# 4. Deploy for inference
docker-compose --profile inference up -d sagemaker-inference

# 5. Test predictions
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"instances": [[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0]]}'
```

This setup teaches you essential SageMaker concepts:
- **Container structure** and environment variables
- **Training job patterns** with proper input/output handling  
- **Model serving** with standard endpoints
- **Data flow** from S3 through training to inference
- **Local development** before AWS deployment




## Directory Structure

Create this structure in your project folder:
```
sagemaker-learning/
├── docker-compose.yml
├── notebook/
│   └── Dockerfile
├── training/
│   ├── Dockerfile
│   └── train.py
├── inference/
│   ├── Dockerfile
│   └── serve.py
├── data/          # Will be created automatically
├── model/         # Will be created automatically  
├── output/        # Will be created automatically
└── notebooks/     # Will be created automatically
```

## Quick Test

After starting the containers:

1. **Open Jupyter** (http://localhost:8888)
2. **Create a new notebook**
3. **Copy and run** the example code I provided
4. **Train the model:** `docker-compose --profile training up sagemaker-training`
5. **Start inference:** `docker-compose --profile inference up -d sagemaker-inference`
6. **Test predictions** using the notebook

The environment is now ready to teach you SageMaker concepts without the Docker build errors!

## How to Use This Now

1. **Build and start the containers:**
```bash
docker-compose up -d sagemaker-notebook localstack minio
```

2. **Access Jupyter at http://localhost:8888**

3. **Create the example notebook** by either:
   - Running the `create_example_notebook.py` script I provided
   - Or manually creating a notebook with the example code