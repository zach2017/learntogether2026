#!/bin/bash

# localstack-init/01-create-bucket.sh
# This script runs automatically when LocalStack starts

set -e

echo "🚀 Initializing LocalStack S3..."

# Wait for LocalStack to be ready
until curl -s http://localhost:4566/health | grep -q '"s3": "available"'; do
  echo "⏳ Waiting for LocalStack S3 service..."
  sleep 2
done

echo "✅ LocalStack S3 is ready!"

# Set AWS CLI defaults for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
ENDPOINT="--endpoint-url=http://localhost:4566"

# Create the main bucket
echo "📦 Creating S3 bucket: file-uploads"
aws $ENDPOINT s3 mb s3://file-uploads --region us-east-1

# Set CORS configuration
echo "🔧 Configuring CORS..."
aws $ENDPOINT s3api put-bucket-cors \
  --bucket file-uploads \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-meta-*"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

# Set bucket policy for public access (development only)
echo "🛡️ Setting bucket policy..."
aws $ENDPOINT s3api put-bucket-policy \
  --bucket file-uploads \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow", 
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::file-uploads/*"
      }
    ]
  }'

# Create additional buckets for testing
echo "📦 Creating additional test buckets..."
aws $ENDPOINT s3 mb s3://test-bucket --region us-east-1
aws $ENDPOINT s3 mb s3://backup-bucket --region us-east-1

# Upload a test file
echo "📄 Creating test file..."
echo "Hello from LocalStack S3!" > /tmp/test-file.txt
aws $ENDPOINT s3 cp /tmp/test-file.txt s3://file-uploads/test-file.txt

# List all buckets to verify
echo "📋 Listing all buckets:"
aws $ENDPOINT s3 ls

echo "📋 Listing files in file-uploads bucket:"
aws $ENDPOINT s3 ls s3://file-uploads/

echo "✅ LocalStack S3 initialization completed!"
echo ""
echo "🌐 Access LocalStack from host machine:"
echo "   aws --endpoint-url=http://localhost:4566 s3 ls"
echo ""
echo "📊 LocalStack Dashboard (if enabled):"
echo "   http://localhost:8080"