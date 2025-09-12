import argparse
import os
import sys
import mimetypes
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

def main():
    parser = argparse.ArgumentParser(
        description="Upload a local file to LocalStack S3 (bucket & endpoint from env)."
    )
    parser.add_argument("filepath", help="Local path to the file to upload")
    parser.add_argument("--key", help="Override S3 object key (default: basename or with S3_PREFIX)")
    args = parser.parse_args()

    filepath = args.filepath
    if not os.path.isfile(filepath):
        print(f"ERROR: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    bucket = os.environ.get("S3_BUCKET_NAME", "file-uploads")
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    addressing_style = os.environ.get("S3_ADDRESSING_STYLE", "path")
    prefix = os.environ.get("S3_PREFIX", "")

    key = args.key or (prefix + os.path.basename(filepath))

    # Try to infer content-type
    ctype, _ = mimetypes.guess_type(filepath)
    extra_args = {}
    if ctype:
        extra_args["ContentType"] = ctype

    session = boto3.session.Session(
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        region_name=region,
    )

    s3 = session.client(
        "s3",
        endpoint_url=endpoint_url,
        config=Config(s3={"addressing_style": addressing_style}, retries={"max_attempts": 5})
    )

    try:
        # Ensure bucket exists (idempotent-ish check)
        s3.head_bucket(Bucket=bucket)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchBucket"):
            print(f"Bucket {bucket} not found. Creating it...")
            s3.create_bucket(Bucket=bucket)
        else:
            print(f"ERROR checking/creating bucket: {e}", file=sys.stderr)
            sys.exit(2)

    try:
        print(f"Uploading {filepath} to s3://{bucket}/{key}")
        s3.upload_file(filepath, bucket, key, ExtraArgs=extra_args)
        # Fetch URL format suitable for LocalStack
        url = f"{endpoint_url}/{bucket}/{key}" if addressing_style == "path" \
              else f"{endpoint_url.replace('http://','http://'+bucket+'.').replace('https://','https://'+bucket+'.')}/{key}"
        print("Upload complete.")
        print(f"Object URL (LocalStack): {url}")
    except (BotoCoreError, ClientError) as e:
        print(f"ERROR uploading file: {e}", file=sys.stderr)
        sys.exit(3)

if __name__ == "__main__":
    main()
