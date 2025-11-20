# Document Upload & Summary System

A comprehensive multi-service application for uploading documents and generating AI-powered summaries using microservices architecture.

## Architecture Overview

The system consists of 5 main services:

### 1. **HTML Frontend (Tailwind CSS)**
- Modern, responsive web interface for document upload
- Real-time document list with status updates
- Multi-file support with drag-and-drop
- Document metadata capture (title, author, description)
- Automatic summary display

### 2. **Spring Boot Backend API**
- RESTful endpoints for document upload and management
- PostgreSQL integration for metadata storage
- S3 bucket integration (LocalStack)
- SQS queue messaging for async processing
- CORS enabled for frontend integration

### 3. **LocalStack Infrastructure**
- S3 service for document storage
- SQS service for message queuing
- Local AWS environment simulation

### 4. **PostgreSQL Database**
- Stores document metadata
- Tracks document status (UPLOADED, PROCESSING, COMPLETED, FAILED)
- Persists generated summaries

### 5. **Python Summary Service**
- Consumes SQS messages
- Downloads documents from S3
- Extracts text from various formats (PDF, DOCX, XLSX, TXT)
- Generates document summaries
- Updates database with summaries via REST API

## System Flow

```
User Upload (HTML)
    ↓
Spring API (/upload)
    ↓
Save to S3 + PostgreSQL
    ↓
Send SQS Message
    ↓
Python Service Polls Queue
    ↓
Download from S3
    ↓
Extract & Summarize Text
    ↓
Update DB via REST API
    ↓
Frontend Auto-Refresh Shows Summary
```

## Prerequisites

- Docker & Docker Compose
- 4GB+ RAM available
- Ports available: 8080 (Spring), 5432 (Postgres), 4566 (LocalStack)

## Quick Start

### 1. Clone and Setup

```bash
cd document-upload-system
```

### 2. Start All Services

```bash
docker-compose up --build
```

The services will start in this order:
1. LocalStack (AWS simulation)
2. PostgreSQL (database)
3. Spring Boot API (http://localhost:8080)
4. Python Summary Service

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

## Usage Guide

### Uploading Documents

1. **Select File**: Click the upload area or drag-and-drop a document
2. **Add Metadata**:
   - Title (optional)
   - Author (optional)
   - Description (optional)
3. **Upload**: Click "Upload Document" button
4. **Monitor**: Watch the documents list for status updates

### Supported File Types

- **PDF** (.pdf)
- **Word** (.docx)
- **Excel** (.xlsx)
- **Text** (.txt)
- **PowerPoint** (.pptx)

Maximum file size: 100MB

### Viewing Documents

The documents list shows:
- Document title and filename
- File size
- Upload date
- Current status badge
- Generated summary (when available)
- Author information

Status codes:
- **UPLOADED**: File received, queued for processing
- **PROCESSING**: Summary generation in progress
- **COMPLETED**: Summary generated successfully
- **FAILED**: Processing error occurred

## API Endpoints

### POST /api/documents/upload
Upload a new document with metadata

**Parameters:**
- `file` (multipart): Document file
- `title` (optional): Document title
- `author` (optional): Author name
- `description` (optional): Brief description

**Response:**
```json
{
  "id": 1,
  "fileName": "report.pdf",
  "s3Key": "uuid/report.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "title": "Q4 Report",
  "author": "John Doe",
  "status": "UPLOADED",
  "createdAt": "2024-01-15T10:30:00"
}
```

### GET /api/documents
Retrieve all documents with their metadata and summaries

**Response:**
```json
[
  {
    "id": 1,
    "fileName": "report.pdf",
    "title": "Q4 Report",
    "summary": "This document contains quarterly...",
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:30:00"
  }
]
```

### GET /api/documents/{id}
Retrieve specific document details

### POST /api/documents/{id}/summary
Manually update document summary

## Configuration

### Environment Variables

**Spring Boot** (docker-compose.yml):
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/document_db
SPRING_DATASOURCE_USERNAME: docuser
SPRING_DATASOURCE_PASSWORD: docpass123
AWS_S3_ENDPOINT: http://localstack:4566
AWS_SQS_ENDPOINT: http://localstack:4566
SQS_QUEUE_NAME: document-queue
```

**Python Service** (docker-compose.yml):
```yaml
AWS_ENDPOINT_URL: http://localstack:4566
SQS_QUEUE_NAME: document-queue
S3_BUCKET_NAME: documents
SPRING_API_URL: http://spring-app:8080/api
```

## Project Structure

```
document-upload-system/
├── docker-compose.yml           # Service orchestration
├── spring-app/
│   ├── pom.xml                 # Maven dependencies
│   ├── Dockerfile              # Spring container config
│   └── src/main/java/
│       └── com/example/documentupload/
│           ├── DocumentUploadApplication.java
│           ├── config/
│           │   └── AwsConfig.java
│           ├── controller/
│           │   └── DocumentController.java
│           ├── dto/
│           │   └── DocumentUploadRequest.java
│           ├── model/
│           │   └── Document.java
│           ├── repository/
│           │   └── DocumentRepository.java
│           └── service/
│               ├── DocumentService.java
│               ├── S3Service.java
│               └── SqsService.java
│   └── src/main/resources/
│       ├── application.properties
│       └── static/
│           └── index.html       # Frontend
└── python-service/
    ├── requirements.txt
    ├── Dockerfile
    ├── main.py                 # SQS consumer
    └── document_extractor.py   # Text extraction
```

## Development & Troubleshooting

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f spring-app
docker-compose logs -f python-service
```

### Check Service Health

```bash
# Check if Spring is running
curl http://localhost:8080/api/documents

# Check database
docker-compose exec postgres psql -U docuser -d document_db -c "SELECT COUNT(*) FROM documents;"
```

### Stop Services

```bash
docker-compose down

# Remove volumes (clean data)
docker-compose down -v
```

## Extending the System

### Adding New File Types

Edit `python-service/document_extractor.py`:

```python
def extract_text_from_[format](file_path: str) -> str:
    # Implementation
    pass

# Add to extract_text_from_file()
elif '[format]' in file_type:
    return extract_text_from_[format](file_path)
```

### Improving Summaries

Replace `generate_summary()` in `document_extractor.py` with:
- ML models (Hugging Face Transformers)
- External APIs (OpenAI, Cohere)
- Advanced NLP libraries

### Database Persistence

Data is stored in Docker volume `postgres_data`. To persist across restarts, ensure the volume remains.

## Performance Tips

1. **Increase File Upload Size**: Modify `application.properties`
   ```properties
   spring.servlet.multipart.max-file-size=500MB
   ```

2. **Parallel Processing**: Increase SQS messages per poll in `main.py`
   ```python
   processor.poll_queue(max_messages=5)
   ```

3. **Database Optimization**: Add indexes
   ```sql
   CREATE INDEX idx_documents_status ON documents(status);
   ```

## Security Notes

- Change default AWS credentials in production
- Use HTTPS/SSL for frontend
- Validate file uploads on backend
- Implement API authentication
- Use environment-specific configurations

## License

MIT

## Support

For issues or questions, check the logs and verify:
1. All services are running: `docker-compose ps`
2. Network connectivity between services
3. Port availability
4. Sufficient disk space

---

**Built with**: Java Spring Boot, Python, PostgreSQL, AWS SDK, Docker
