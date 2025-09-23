#!/usr/bin/env python3
"""
Script to create the example SageMaker notebook
Run this inside the Jupyter container or save as a .py file and execute
"""

import os
import json

def create_example_notebook():
    notebook_content = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# SageMaker Local Learning Example\n",
                    "\n",
                    "This notebook demonstrates how to use the local SageMaker environment for learning ML workflows."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Setup and imports\n",
                    "import boto3\n",
                    "import pandas as pd\n",
                    "import numpy as np\n",
                    "from sklearn.datasets import make_classification\n",
                    "from sklearn.model_selection import train_test_split\n",
                    "import os\n",
                    "import requests\n",
                    "import json\n",
                    "\n",
                    "print(\"Environment setup complete!\")"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Configure local endpoints\n",
                    "# For LocalStack\n",
                    "os.environ['AWS_ENDPOINT_URL'] = 'http://localstack:4566'\n",
                    "os.environ['AWS_ACCESS_KEY_ID'] = 'test'\n",
                    "os.environ['AWS_SECRET_ACCESS_KEY'] = 'test'\n",
                    "os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'\n",
                    "\n",
                    "print(\"Local AWS endpoints configured\")"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Create sample dataset\n",
                    "print(\"Creating sample dataset...\")\n",
                    "\n",
                    "# Generate synthetic classification dataset\n",
                    "X, y = make_classification(\n",
                    "    n_samples=1000,\n",
                    "    n_features=20,\n",
                    "    n_informative=10,\n",
                    "    n_redundant=10,\n",
                    "    n_classes=2,\n",
                    "    random_state=42\n",
                    ")\n",
                    "\n",
                    "# Create DataFrame\n",
                    "feature_names = [f'feature_{i}' for i in range(X.shape[1])]\n",
                    "df = pd.DataFrame(X, columns=feature_names)\n",
                    "df['target'] = y\n",
                    "\n",
                    "print(f\"Dataset shape: {df.shape}\")\n",
                    "print(f\"Target distribution:\\n{df['target'].value_counts()}\")\n",
                    "df.head()"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Save training data\n",
                    "data_dir = '/home/jovyan/data'\n",
                    "os.makedirs(data_dir, exist_ok=True)\n",
                    "\n",
                    "train_path = os.path.join(data_dir, 'training_data.csv')\n",
                    "df.to_csv(train_path, index=False)\n",
                    "print(f\"Training data saved to: {train_path}\")\n",
                    "\n",
                    "# Verify the file\n",
                    "print(f\"File size: {os.path.getsize(train_path)} bytes\")\n",
                    "print(f\"First few lines:\")\n",
                    "with open(train_path, 'r') as f:\n",
                    "    for i, line in enumerate(f):\n",
                    "        if i < 3:\n",
                    "            print(line.strip())\n",
                    "        else:\n",
                    "            break"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Test local S3 with MinIO\n",
                    "try:\n",
                    "    s3_client = boto3.client(\n",
                    "        's3',\n",
                    "        endpoint_url='http://minio:9000',\n",
                    "        aws_access_key_id='minioadmin',\n",
                    "        aws_secret_access_key='minioadmin',\n",
                    "        region_name='us-east-1'\n",
                    "    )\n",
                    "    \n",
                    "    # Create bucket\n",
                    "    bucket_name = 'sagemaker-training-data'\n",
                    "    try:\n",
                    "        s3_client.create_bucket(Bucket=bucket_name)\n",
                    "        print(f\"Created bucket: {bucket_name}\")\n",
                    "    except Exception as e:\n",
                    "        print(f\"Bucket {bucket_name} already exists or error: {e}\")\n",
                    "    \n",
                    "    # Upload training data\n",
                    "    s3_client.upload_file(train_path, bucket_name, 'training_data.csv')\n",
                    "    print(\"Training data uploaded to S3\")\n",
                    "    \n",
                    "    # List objects\n",
                    "    response = s3_client.list_objects_v2(Bucket=bucket_name)\n",
                    "    if 'Contents' in response:\n",
                    "        for obj in response['Contents']:\n",
                    "            print(f\"S3 Object: {obj['Key']} (Size: {obj['Size']} bytes)\")\n",
                    "\n",
                    "except Exception as e:\n",
                    "    print(f\"S3 operations failed: {e}\")\n",
                    "    print(\"Make sure MinIO container is running: docker-compose up -d minio\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Training a Model\n",
                    "\n",
                    "Now let's train a model using our containerized training environment. Run this command in your terminal:\n",
                    "\n",
                    "```bash\n",
                    "docker-compose --profile training up sagemaker-training\n",
                    "```\n",
                    "\n",
                    "This will:\n",
                    "1. Load the training data we just created\n",
                    "2. Train a Random Forest model\n",
                    "3. Save the trained model to `/model` directory\n",
                    "4. Generate training metrics and metadata"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Check if model was trained\n",
                    "model_dir = '/home/jovyan/work/model'\n",
                    "if os.path.exists(model_dir):\n",
                    "    files = os.listdir(model_dir)\n",
                    "    print(f\"Model directory contents: {files}\")\n",
                    "    \n",
                    "    # Check model file\n",
                    "    model_file = os.path.join(model_dir, 'model.joblib')\n",
                    "    if os.path.exists(model_file):\n",
                    "        print(f\"Model file size: {os.path.getsize(model_file)} bytes\")\n",
                    "        print(\"✅ Model training completed successfully!\")\n",
                    "    else:\n",
                    "        print(\"❌ Model file not found. Run the training container first.\")\n",
                    "else:\n",
                    "    print(\"❌ Model directory not found. Run the training container first.\")\n",
                    "    print(\"Command: docker-compose --profile training up sagemaker-training\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Model Inference\n",
                    "\n",
                    "Let's deploy our trained model for inference. Run this command in your terminal:\n",
                    "\n",
                    "```bash\n",
                    "docker-compose --profile inference up -d sagemaker-inference\n",
                    "```\n",
                    "\n",
                    "This starts a model server that provides SageMaker-compatible REST endpoints."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "# Test model inference\n",
                    "inference_url = \"http://sagemaker-inference:8080\"\n",
                    "\n",
                    "try:\n",
                    "    # Health check\n",
                    "    health_response = requests.get(f\"{inference_url}/ping\", timeout=5)\n",
                    "    print(f\"Health check status: {health_response.status_code}\")\n",
                    "    print(f\"Health check response: {health_response.json()}\")\n",
                    "    \n",
                    "    if health_response.status_code == 200:\n",
                    "        # Prepare sample data for prediction\n",
                    "        sample_data = {\n",
                    "            \"instances\": [\n",
                    "                [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,\n",
                    "                 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0],\n",
                    "                [-0.5, -0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3, 0.4,\n",
                    "                 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4]\n",
                    "            ]\n",
                    "        }\n",
                    "        \n",
                    "        # Make prediction\n",
                    "        prediction_response = requests.post(\n",
                    "            f\"{inference_url}/invocations\",\n",
                    "            json=sample_data,\n",
                    "            headers={'Content-Type': 'application/json'},\n",
                    "            timeout=10\n",
                    "        )\n",
                    "        \n",
                    "        if prediction_response.status_code == 200:\n",
                    "            result = prediction_response.json()\n",
                    "            print(f\"\\n✅ Prediction successful!\")\n",
                    "            print(f\"Predictions: {result['predictions']}\")\n",
                    "            if 'probabilities' in result:\n",
                    "                print(f\"Probabilities: {result['probabilities']}\")\n",
                    "        else:\n",
                    "            print(f\"❌ Prediction failed: {prediction_response.status_code}\")\n",
                    "            print(f\"Error: {prediction_response.text}\")\n",
                    "    \n",
                    "        # Get model info\n",
                    "        info_response = requests.get(f\"{inference_url}/model-info\", timeout=5)\n",
                    "        if info_response.status_code == 200:\n",
                    "            model_info = info_response.json()\n",
                    "            print(f\"\\nModel Information:\")\n",
                    "            print(f\"Model Type: {model_info.get('model_type')}\")\n",
                    "            if 'feature_importances' in model_info:\n",
                    "                importances = model_info['feature_importances']\n",
                    "                print(f\"Top 5 Feature Importances:\")\n",
                    "                for i, imp in enumerate(sorted(enumerate(importances), key=lambda x: x[1], reverse=True)[:5]):\n",
                    "                    print(f\"  Feature {imp[0]}: {imp[1]:.4f}\")\n",
                    "        \n",
                    "except requests.exceptions.RequestException as e:\n",
                    "    print(f\"❌ Connection failed: {e}\")\n",
                    "    print(\"Make sure to run: docker-compose --profile inference up -d sagemaker-inference\")\n",
                    "    print(\"Then wait 10-15 seconds for the container to fully start\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Next Steps for Learning\n",
                    "\n",
                    "Congratulations! You've successfully:\n",
                    "\n",
                    "1. ✅ Created a training dataset\n",
                    "2. ✅ Uploaded data to local S3 (MinIO)\n",
                    "3. ✅ Trained a machine learning model\n",
                    "4. ✅ Deployed the model for inference\n",
                    "5. ✅ Made predictions via REST API\n",
                    "\n",
                    "### Try These Next:\n",
                    "\n",
                    "1. **Experiment with hyperparameters**: Modify the training script to try different algorithms\n",
                    "2. **Use your own data**: Replace the synthetic data with real datasets\n",
                    "3. **Add model monitoring**: Implement logging and metrics collection\n",
                    "4. **Try batch inference**: Process multiple files at once\n",
                    "5. **Deploy to real AWS**: Use SageMaker SDK to deploy to actual AWS\n",
                    "\n",
                    "### Understanding SageMaker Concepts:\n",
                    "\n",
                    "- **Training Container**: Follows `/opt/ml/` directory structure\n",
                    "- **Model Artifacts**: Saved to `/opt/ml/model/`\n",
                    "- **Input Data**: Loaded from `/opt/ml/input/data/`\n",
                    "- **Inference Endpoints**: Standard `/ping` and `/invocations` APIs\n",
                    "- **Environment Variables**: `SM_MODEL_DIR`, `SM_CHANNEL_TRAINING`, etc.\n",
                    "\n",
                    "This local environment mirrors real SageMaker behavior, making it perfect for learning and development!"
                ]
            }
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.9.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    
    # Create the examples directory and notebook file
    os.makedirs('examples', exist_ok=True)
    
    notebook_path = 'examples/sagemaker_local_example.ipynb'
    with open(notebook_path, 'w') as f:
        json.dump(notebook_content, f, indent=2)
    
    print(f"Created example notebook: {notebook_path}")

if __name__ == "__main__":
    create_example_notebook()
