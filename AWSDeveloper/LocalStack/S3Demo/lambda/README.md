# Lambda Setup

- aws --profile localstack --endpoint-url http://localhost:4566 lambda create-function --function-name upload-to-s3 --runtime python3.12 --role arn:aws:iam::000000000000:role/lambda-s3-role --handler app.handler --zip-file fileb://lambda.zip --environment Variables="{BUCKET_NAME=file-uploads,S3_ENDPOINT=http://s3.localhost.localstack.cloud:4566}"

```
{
    "FunctionName": "upload-to-s3",
    "FunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:upload-to-s3",
    "Runtime": "python3.12",
    "Role": "arn:aws:iam::000000000000:role/lambda-s3-role",
    "Handler": "app.handler",
    "CodeSize": 754,
    "Description": "",
    "Timeout": 3,
    "MemorySize": 128,
    "LastModified": "2025-09-15T18:46:46.318901+0000",
    "CodeSha256": "ANF861JGBYJhzFLBfcBiEi2d1y/30Vt3pN/ayyGWlPQ=",
    "Version": "$LATEST",
    "Environment": {
        "Variables": {
            "BUCKET_NAME": "file-uploads",
            "S3_ENDPOINT": "http://s3.localhost.localstack.cloud:4566"
        }
    },
    "TracingConfig": {
        "Mode": "PassThrough"
    },
    "RevisionId": "03d38f7e-0b82-4c3f-bbc4-56e88e96d753",
    "State": "Pending",
    "StateReason": "The function is being created.",
    "StateReasonCode": "Creating",
    "PackageType": "Zip",
    "Architectures": [
        "x86_64"
    ],
    "EphemeralStorage": {
        "Size": 512
    },
    "SnapStart": {
        "ApplyOn": "None",
        "OptimizationStatus": "Off"
    },
    "RuntimeVersionConfig": {
        "RuntimeVersionArn": "arn:aws:lambda:us-east-1::runtime:8eeff65f6809a3ce81507fe733fe09b835899b99481ba22fd75b5a7338290ec1"
    },
    "LoggingConfig": {
        "LogFormat": "Text",
        "LogGroup": "/aws/lambda/upload-to-s3"
    }
}
```

# Test Lambda

aws --profile localstack --endpoint-url http://localhost:4566 lambda invoke --function-name upload-to-s3 --cli-binary-format raw-in-base64-out --payload '{"filename":"uploads/hello.txt","text":"Hello from Lambda!"}' out.json
