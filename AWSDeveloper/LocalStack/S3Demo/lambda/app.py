import os
import json
import uuid
import base64
import boto3
from typing import Any, Dict

S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "http://s3.localhost.localstack.cloud:4566")
BUCKET = "file-uploads" 

s3 = boto3.client("s3", endpoint_url=S3_ENDPOINT)

def _parse_event(event: Any) -> Dict[str, Any]:
    """
    Supports:
      - Direct Lambda invoke (dict or JSON string)
      - API Gateway HTTP API v2 (event['body'], possibly base64-encoded)
    Returns a dict payload with optional keys:
      filename, text, content_base64, content_type
    """
    # If event is a raw JSON string
    if isinstance(event, str):
        try:
            event = json.loads(event)
        except json.JSONDecodeError:
            return {}

    if not isinstance(event, dict):
        return {}

    # API Gateway HTTP API v2 (payload-format-version 2.0)
    if "body" in event:
        body = event["body"] or ""
        if event.get("isBase64Encoded"):
            try:
                body = base64.b64decode(body).decode("utf-8")
            except Exception:
                body = ""  # fall back to empty if decode fails
        if isinstance(body, str) and body.strip():
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                # If body isn't JSON, treat it as plain text
                return {"text": body}
        return {}

    # Direct invoke (already a dict)
    return event

def handler(event, context):
    payload = _parse_event(event)

    filename = payload.get("filename") or f"uploads/upload-{uuid.uuid4()}.txt"

    if "content_base64" in payload:
        body = base64.b64decode(payload["content_base64"])
        content_type = payload.get("content_type", "application/octet-stream")
    elif "text" in payload:
        body = payload["text"].encode("utf-8")
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
