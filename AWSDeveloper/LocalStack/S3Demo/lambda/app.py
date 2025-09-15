import os
import json
import uuid
import base64
import boto3

# Use LocalStack's per-service endpoint (works inside/outside containers)
# You can override via env var if needed.
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "http://s3.localhost.localstack.cloud:4566")
BUCKET = os.environ["BUCKET_NAME"]

s3 = boto3.client("s3", endpoint_url=S3_ENDPOINT)

def handler(event, context):
    """
    Event options:
      - {"filename": "uploads/hello.txt", "text": "Hello!"}
      - {"filename": "uploads/photo.jpg", "content_base64": "<base64 string>", "content_type": "image/jpeg"}
    If nothing provided, writes a default text file.
    """
    filename = event.get("filename") or f"uploads/upload-{uuid.uuid4()}.txt"

    if "content_base64" in event:
        body = base64.b64decode(event["content_base64"])
        content_type = event.get("content_type", "application/octet-stream")
    elif "text" in event:
        body = event["text"].encode("utf-8")
        content_type = "text/plain"
    else:
        body = b"Hello from Lambda via LocalStack!"
        content_type = "text/plain"

    s3.put_object(Bucket=BUCKET, Key=filename, Body=body, ContentType=content_type)

    return {
        "status": "ok",
        "bucket": BUCKET,
        "key": filename,
        "size": len(body)
    }
