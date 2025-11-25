#!/bin/bash

# Test script for SQS API endpoints

API_URL="http://localhost:8080/api/sqs"

echo "================================"
echo "SQS API Test Script"
echo "================================"
echo ""

# Check if the app is running
echo "1. Checking health endpoint..."
curl -s "$API_URL/health" | jq '.'
echo -e "\n"

# Publish first message
echo "2. Publishing first message..."
curl -s -X POST "$API_URL/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "First test message from script",
    "type": "INFO",
    "priority": "LOW",
    "metadata": {
      "source": "test-script",
      "userId": "user001",
      "tags": ["test", "automated"]
    }
  }' | jq '.'
echo -e "\n"

# Publish second message
echo "3. Publishing second message..."
curl -s -X POST "$API_URL/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Second test message - high priority",
    "type": "ALERT",
    "priority": "HIGH",
    "metadata": {
      "source": "monitoring",
      "userId": "system",
      "tags": ["critical", "urgent"]
    }
  }' | jq '.'
echo -e "\n"

# Publish third message
echo "4. Publishing third message..."
curl -s -X POST "$API_URL/publish" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Third test message - notification",
    "type": "NOTIFICATION",
    "priority": "MEDIUM"
  }' | jq '.'
echo -e "\n"

# Check health again to see message count
echo "5. Checking queue status..."
curl -s "$API_URL/health" | jq '.'
echo -e "\n"

# Read first message
echo "6. Reading first message..."
curl -s "$API_URL/read" | jq '.'
echo -e "\n"

# Read second message
echo "7. Reading second message..."
curl -s "$API_URL/read" | jq '.'
echo -e "\n"

# Read third message
echo "8. Reading third message..."
curl -s "$API_URL/read" | jq '.'
echo -e "\n"

# Try to read from empty queue
echo "9. Attempting to read from empty queue..."
curl -s "$API_URL/read" | jq '.'
echo -e "\n"

# Final health check
echo "10. Final health check..."
curl -s "$API_URL/health" | jq '.'
echo -e "\n"

echo "================================"
echo "Test completed!"
echo "================================"
