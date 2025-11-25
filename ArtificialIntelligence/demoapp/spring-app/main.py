import json
import logging
import os
import time
import tempfile
import requests
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError

from document_extractor import extract_text_from_file, generate_summary

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
AWS_ENDPOINT_URL = os.getenv('AWS_ENDPOINT_URL', 'http://localstack:4566')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'test')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'test')
SQS_QUEUE_NAME = os.getenv('SQS_QUEUE_NAME', 'document-queue')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'documents')
SPRING_API_URL = os.getenv('SPRING_API_URL', 'http://spring-app:8080/api')


class DocumentProcessor:
    def __init__(self, max_retries=10):
        self.max_retries = max_retries
        self.s3_client = None
        self.sqs_client = None
        self.queue_url = None
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize AWS clients with retry logic"""
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Initializing AWS clients (attempt {attempt + 1}/{self.max_retries})...")
                
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=AWS_ENDPOINT_URL,
                    region_name=AWS_REGION,
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                )
                
                self.sqs_client = boto3.client(
                    'sqs',
                    endpoint_url=AWS_ENDPOINT_URL,
                    region_name=AWS_REGION,
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                )
                
                # Test connectivity
                self.s3_client.list_buckets()
                logger.info("✓ S3 client initialized successfully")
                
                self._initialize_queue()
                logger.info("✓ All AWS clients initialized successfully")
                return
                
            except Exception as e:
                logger.warning(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    wait_time = min(5 * (attempt + 1), 30)
                    logger.info(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    logger.error("Failed to initialize AWS clients after all retries")
                    raise

    def _initialize_queue(self):
        """Get or create SQS queue"""
        try:
            response = self.sqs_client.get_queue_url(QueueName=SQS_QUEUE_NAME)
            self.queue_url = response['QueueUrl']
            logger.info(f"✓ Connected to queue: {self.queue_url}")
        except ClientError as e:
            logger.error(f"Error getting queue URL: {e}")
            self.queue_url = None

    def process_message(self, message: Dict[str, Any]) -> bool:
        """Process a single SQS message"""
        try:
            body = json.loads(message['Body'])
            document_id = body.get('documentId')
            s3_key = body.get('s3Key')
            file_name = body.get('fileName')

            logger.info(f"Processing document: {file_name} (ID: {document_id})")

            # Download file from S3
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_path = tmp_file.name
                try:
                    self.s3_client.download_file(S3_BUCKET_NAME, s3_key, tmp_path)
                    logger.info(f"✓ Downloaded file to: {tmp_path}")
                except Exception as e:
                    logger.error(f"Failed to download file from S3: {e}")
                    return False

            # Extract text based on file type
            content_type = self._get_content_type(file_name)
            text = extract_text_from_file(tmp_path, content_type)
            
            if not text:
                logger.warning(f"No text extracted from {file_name}")
                summary = "Could not extract text from document"
            else:
                # Generate summary
                summary = generate_summary(text)
                logger.info(f"✓ Generated summary for {file_name}")

            # Update document with summary via Spring API
            self._update_document_summary(document_id, s3_key, summary)

            # Clean up temp file
            os.remove(tmp_path)

            # Delete message from queue
            try:
                self.sqs_client.delete_message(
                    QueueUrl=self.queue_url,
                    ReceiptHandle=message['ReceiptHandle']
                )
                logger.info(f"✓ Successfully processed and deleted message for: {file_name}")
                return True
            except Exception as e:
                logger.error(f"Failed to delete message from queue: {e}")
                return False

        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            return False

    def _get_content_type(self, file_name: str) -> str:
        """Determine content type from filename"""
        if file_name.endswith('.pdf'):
            return 'application/pdf'
        elif file_name.endswith('.docx'):
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif file_name.endswith('.xlsx'):
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif file_name.endswith('.txt'):
            return 'text/plain'
        else:
            return 'application/octet-stream'

    def _update_document_summary(self, document_id: str, s3_key: str, summary: str):
        """Update document summary in Spring app via REST API with retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                url = f"{SPRING_API_URL}/documents/{document_id}/summary"
                headers = {'Content-Type': 'text/plain'}
                
                logger.debug(f"Sending summary to {url}")
                response = requests.post(url, data=summary, headers=headers, timeout=10)
                
                if response.status_code in [200, 201]:
                    logger.info(f"✓ Updated summary for document {document_id}")
                    return True
                else:
                    logger.warning(f"API returned status {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.warning(f"API call attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error(f"Failed to update summary after {max_retries} attempts")
                    
        return False

    def poll_queue(self, wait_time: int = 20, max_messages: int = 1):
        """Poll SQS queue for messages"""
        if not self.queue_url:
            logger.error("Queue URL not initialized")
            return 0

        try:
            response = self.sqs_client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                VisibilityTimeout=300
            )

            messages = response.get('Messages', [])
            processed_count = 0

            for message in messages:
                if self.process_message(message):
                    processed_count += 1

            return processed_count

        except Exception as e:
            logger.error(f"Error polling queue: {e}", exc_info=True)
            return 0


def main():
    """Main entry point"""
    logger.info("="*70)
    logger.info("Starting Document Processor Service...")
    logger.info(f"AWS Endpoint: {AWS_ENDPOINT_URL}")
    logger.info(f"S3 Bucket: {S3_BUCKET_NAME}")
    logger.info(f"SQS Queue: {SQS_QUEUE_NAME}")
    logger.info(f"Spring API: {SPRING_API_URL}")
    logger.info("="*70)
    
    processor = DocumentProcessor()

    # Give services time to initialize
    logger.info("Waiting for services to stabilize...")
    time.sleep(5)

    logger.info("Beginning to poll SQS queue...")
    logger.info("-"*70)
    
    consecutive_errors = 0
    max_consecutive_errors = 5
    
    try:
        while True:
            try:
                processed = processor.poll_queue(wait_time=20, max_messages=1)
                if processed > 0:
                    logger.info(f"Processed {processed} message(s)")
                    consecutive_errors = 0
                time.sleep(1)
                
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Error in polling loop: {e} (consecutive errors: {consecutive_errors})")
                
                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"Too many consecutive errors ({max_consecutive_errors}), attempting to reinitialize...")
                    try:
                        processor = DocumentProcessor()
                        consecutive_errors = 0
                    except Exception as reinit_error:
                        logger.error(f"Reinitialization failed: {reinit_error}")
                        time.sleep(10)
                else:
                    time.sleep(5)
                    
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        logger.info("="*70)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        logger.info("="*70)


if __name__ == '__main__':
    main()

