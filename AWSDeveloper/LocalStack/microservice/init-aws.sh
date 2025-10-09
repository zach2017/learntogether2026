#!/bin/bash

echo "Initializing LocalStack resources..."

# Wait for LocalStack to be ready
sleep 5

# Create S3 bucket
awslocal s3 mb s3://file-uploads
awslocal s3api put-bucket-cors --bucket file-uploads --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"]
  }]
}'

# Create DynamoDB table
awslocal dynamodb create-table \
    --table-name file-metadata \
    --attribute-definitions \
        AttributeName=fileId,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=fileId,KeyType=HASH \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"UserIdIndex\",
            \"KeySchema\": [{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
        }]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5

echo "LocalStack initialization complete!"