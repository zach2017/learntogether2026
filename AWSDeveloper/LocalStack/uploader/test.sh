#!/bin/bash

# localstack-commands.sh
# Collection of useful LocalStack S3 commands for testing

# Set LocalStack endpoint
ENDPOINT="--endpoint-url=http://localhost:4566"
BUCKET="file-uploads"

echo "🚀 LocalStack S3 Command Examples"
echo "=================================="
echo ""

echo "📋 Basic Commands:"
echo "------------------"

echo "# Check LocalStack health"
echo "curl http://localhost:4566/health"
echo ""

echo "# List all buckets"
echo "aws $ENDPOINT s3 ls"
echo ""

echo "# List files in bucket"
echo "aws $ENDPOINT s3 ls s3://$BUCKET/ --recursive"
echo ""

echo "# Upload a file"
echo "aws $ENDPOINT s3 cp myfile.txt s3://$BUCKET/"
echo ""

echo "# Download a file"
echo "aws $ENDPOINT s3 cp s3://$BUCKET/myfile.txt ./downloaded-file.txt"
echo ""

echo "# Delete a file"
echo "aws $ENDPOINT s3 rm s3://$BUCKET/myfile.txt"
echo ""

echo "📊 Advanced Commands:"
echo "--------------------"

echo "# Get bucket location"
echo "aws $ENDPOINT s3api get-bucket-location --bucket $BUCKET"
echo ""

echo "# Get bucket CORS configuration"
echo "aws $ENDPOINT s3api get-bucket-cors --bucket $BUCKET"
echo ""

echo "# Get bucket policy"
echo "aws $ENDPOINT s3api get-bucket-policy --bucket $BUCKET"
echo ""

echo "# Create a new bucket"
echo "aws $ENDPOINT s3 mb s3://my-new-bucket"
echo ""

echo "# Sync directory to S3"
echo "aws $ENDPOINT s3 sync ./my-folder s3://$BUCKET/my-folder/"
echo ""

echo "# Generate presigned URL (expires in 1 hour)"
echo "aws $ENDPOINT s3 presign s3://$BUCKET/myfile.txt --expires-in 3600"
echo ""

echo "🔧 Debugging Commands:"
echo "----------------------"

echo "# Check if bucket exists"
echo "aws $ENDPOINT s3api head-bucket --bucket $BUCKET"
echo ""

echo "# Get object metadata"
echo "aws $ENDPOINT s3api head-object --bucket $BUCKET --key myfile.txt"
echo ""

echo "# List multipart uploads"
echo "aws $ENDPOINT s3api list-multipart-uploads --bucket $BUCKET"
echo ""

echo "📝 Test Script:"
echo "---------------"

cat << 'SCRIPT'
#!/bin/bash
# Quick test script

ENDPOINT="--endpoint-url=http://localhost:4566"
BUCKET="file-uploads"

echo "Testing LocalStack S3..."

# Create a test file
echo "Hello LocalStack!" > test-file.txt

# Upload the file
echo "Uploading test file..."
aws $ENDPOINT s3 cp test-file.txt s3://$BUCKET/

# List files
echo "Files in bucket:"
aws $ENDPOINT s3 ls s3://$BUCKET/

# Download the file
echo "Downloading test file..."
aws $ENDPOINT s3 cp s3://$BUCKET/test-file.txt ./downloaded-test.txt

# Verify content
echo "Downloaded content:"
cat downloaded-test.txt

# Clean up
rm test-file.txt downloaded-test.txt

echo "Test completed!"
SCRIPT