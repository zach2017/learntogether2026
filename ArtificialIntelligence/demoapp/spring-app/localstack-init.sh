#!/bin/bash

# LocalStack initialization script - creates S3 bucket and SQS queue

set -e

echo "=== Starting LocalStack Initialization ==="

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
for i in {1..60}; do
  if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo "✓ LocalStack is ready"
    break
  fi
  echo "Waiting... ($i/60)"
  sleep 1
done

# Set AWS credentials
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

LOCALSTACK_HOSTNAME=localhost
EDGE_PORT=4566

echo ""
echo "=== Creating S3 Bucket ==="
aws s3 mb s3://documents \
  --endpoint-url http://${LOCALSTACK_HOSTNAME}:${EDGE_PORT} \
  --region us-east-1 2>/dev/null || echo "✓ Bucket 'documents' already exists or created"

echo "✓ S3 bucket ready"

echo ""
echo "=== Creating SQS Queue ==="
QUEUE_URL=$(aws sqs create-queue \
  --queue-name document-queue \
  --endpoint-url http://${LOCALSTACK_HOSTNAME}:${EDGE_PORT} \
  --region us-east-1 \
  --query 'QueueUrl' \
  --output text 2>/dev/null) || echo "Queue may already exist"

if [ -n "$QUEUE_URL" ]; then
  echo "✓ SQS Queue created: $QUEUE_URL"
else
  # Try to get existing queue URL
  QUEUE_URL=$(aws sqs get-queue-url \
    --queue-name document-queue \
    --endpoint-url http://${LOCALSTACK_HOSTNAME}:${EDGE_PORT} \
    --region us-east-1 \
    --query 'QueueUrl' \
    --output text 2>/dev/null)
  echo "✓ SQS Queue exists: $QUEUE_URL"
fi

echo ""
echo "=== Verifying Resources ==="
echo "S3 Buckets:"
aws s3 ls --endpoint-url http://${LOCALSTACK_HOSTNAME}:${EDGE_PORT} --region us-east-1

echo ""
echo "SQS Queues:"
aws sqs list-queues --endpoint-url http://${LOCALSTACK_HOSTNAME}:${EDGE_PORT} --region us-east-1

echo ""
echo "=== LocalStack Initialization Complete ==="
