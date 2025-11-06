#!/bin/bash

# LocalStack initialization script
# Creates S3 bucket and SQS queue if not automatically created

echo "Initializing LocalStack resources..."

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
sleep 10

# Create S3 bucket
echo "Creating S3 bucket..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://documents --region us-east-1 2>/dev/null || echo "Bucket may already exist"

# Create SQS queue
echo "Creating SQS queue..."
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name document-queue --region us-east-1 2>/dev/null || echo "Queue may already exist"

echo "LocalStack initialization complete!"
