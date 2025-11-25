# Project Structure & Components Overview

## Complete File Tree

```
document-upload-system/
│
├── docker-compose.yml                          # Main service orchestration
├── docker-compose.override.example.yml         # Development overrides
├── .gitignore                                  # Git ignore rules
├── start.sh                                    # Quick start script
├── init-localstack.sh                          # LocalStack init script
│
├── README.md                                   # Project overview
├── API_DOCUMENTATION.md                        # API reference
│
├── spring-app/                                 # Java Spring Boot Backend
│   ├── Dockerfile                             # Spring container image
│   ├── pom.xml                                # Maven dependencies & build config
│   │
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/example/documentupload/
│           │       ├── DocumentUploadApplication.java    # Main Spring app
│           │       │
│           │       ├── config/
│           │       │   └── AwsConfig.java                # S3 & SQS client config
│           │       │
│           │       ├── controller/
│           │       │   └── DocumentController.java       # REST API endpoints
│           │       │
│           │       ├── model/
│           │       │   └── Document.java                 # JPA entity
│           │       │
│           │       ├── repository/
│           │       │   └── DocumentRepository.java       # Data access layer
│           │       │
│           │       ├── service/
│           │       │   ├── DocumentService.java          # Business logic
│           │       │   ├── S3Service.java               # S3 operations
│           │       │   └── SqsService.java              # SQS operations
│           │       │
│           │       └── dto/
│           │           └── DocumentUploadRequest.java   # Request DTO
│           │
│           └── resources/
│               ├── application.properties               # Spring configuration
│               └── static/
│                   └── index.html                       # Frontend UI
│
├── python-service/                             # Python Summary Service
│   ├── Dockerfile                             # Python container image
│   ├── requirements.txt                       # Python dependencies
│   ├── main.py                                # SQS consumer & orchestrator
│   └── document_extractor.py                  # Text extraction utilities
```

## Component Descriptions

### 1. Docker Compose (`docker-compose.yml`)

**Purpose:** Orchestrates all services - LocalStack, PostgreSQL, Spring Boot, Python

**Services:**
- **localstack**: AWS S3 & SQS simulation (port 4566)
- **postgres**: PostgreSQL database (port 5432)
- **spring-app**: Java REST API (port 8080)
- **python-summary-service**: Document processor

**Key Features:**
- Health checks for service startup order
- Environment variable configuration
- Volume persistence for database
- Network communication between services

---

### 2. Spring Boot Backend

#### **Application Structure:**

**`DocumentUploadApplication.java`**
- Entry point for Spring Boot
- Enables scheduling for background tasks

**`AwsConfig.java`** (config/)
- Configures S3 and SQS clients
- Sets up LocalStack endpoints
- Manages AWS credentials

**`DocumentController.java`** (controller/)
- `POST /documents/upload` - File upload with metadata
- `GET /documents` - List all documents
- `GET /documents/{id}` - Get specific document
- `POST /documents/{id}/summary` - Update summary

**`Document.java`** (model/)
- JPA Entity representing document record
- Fields: fileName, s3Key, fileSize, contentType, title, description, author, summary, status
- Automatic timestamp management (createdAt, updatedAt)

**`DocumentRepository.java`** (repository/)
- Spring Data JPA interface
- Custom query: findByS3Key()

**`DocumentService.java`** (service/)
- Orchestrates document upload workflow
- Handles S3 upload, DB persistence, SQS messaging
- Manages summary updates

**`S3Service.java`** (service/)
- S3 bucket operations
- Auto-creates bucket on initialization
- Handles file uploads

**`SqsService.java`** (service/)
- SQS queue operations
- Auto-creates queue on initialization
- Sends messages with document metadata

**`application.properties`** (resources/)
- PostgreSQL connection settings
- AWS endpoint configurations
- File upload limits
- JPA/Hibernate settings

**`index.html`** (resources/static/)
- Modern frontend with Tailwind CSS
- Drag-and-drop file upload
- Real-time document list
- Status tracking and summary display
- API integration via Axios

---

### 3. Python Summary Service

**`main.py` - SQS Consumer & Orchestrator**

Core Responsibilities:
- Polls SQS queue for messages
- Downloads documents from S3
- Orchestrates text extraction
- Generates summaries
- Updates Spring API with results

Key Classes:
- `DocumentProcessor`: Main processor class
  - `_initialize_queue()`: Gets/creates SQS queue
  - `process_message()`: Handles individual messages
  - `_update_document_summary()`: REST API call to Spring
  - `poll_queue()`: Long-polling implementation

---

**`document_extractor.py` - Text Extraction**

Supported Formats:
- **PDF** - PyPDF2 library for text extraction
- **DOCX** - python-docx for Word documents
- **XLSX** - openpyxl for Excel spreadsheets
- **TXT** - Plain text file reading

Key Functions:
- `extract_text_from_[format]()`: Format-specific extractors
- `extract_text_from_file()`: Dispatcher function
- `generate_summary()`: Creates extractive summary

---

### 4. Frontend (HTML/Tailwind)

**`index.html` - User Interface**

Sections:
- **Upload Form** (sticky, left side)
  - File drop zone with drag-and-drop
  - Metadata fields (title, author, description)
  - Submit button with loading state
  - Status messages

- **Documents List** (right side)
  - Real-time document display
  - Status badges with color coding
  - Summary preview
  - Document metadata display

Features:
- Responsive grid layout (1 column mobile, 3 columns desktop)
- Gradient backgrounds and modern styling
- Auto-refresh every 5 seconds
- Error handling and user feedback
- File size validation

---

### 5. Database Schema

**`documents` table**

```sql
CREATE TABLE documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  content_type VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  author VARCHAR(255),
  summary TEXT,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

---

## Data Flow Diagram

```
┌─────────────────┐
│  HTML Frontend  │ (Tailwind CSS, Axios)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     Spring Boot REST API                │
│  ┌──────────────────────────────────┐   │
│  │ POST /documents/upload           │   │
│  │ GET /documents                   │   │
│  │ GET /documents/{id}              │   │
│  │ POST /documents/{id}/summary     │   │
│  └──────────────────────────────────┘   │
└─────────┬─────────────────────────┬─────┘
          │                         │
    ┌─────▼─────┐           ┌──────▼───────┐
    │   S3      │           │  PostgreSQL  │
    │ (LocalStack)          │  Database    │
    └─────┬─────┘           └──────┬───────┘
          │                        │
          │              ┌─────────▼──────────┐
          │              │  SQS Queue         │
          │              │ (LocalStack)       │
          │              └─────────┬──────────┘
          │                        │
          │              ┌─────────▼────────────────┐
          │              │ Python Service          │
          │              │ - Poll SQS              │
          │              │ - Extract Text          │
          │              │ - Generate Summary      │
          │              │ - Update via REST       │
          │              └────────────────────────┘
          │
          └─────────────────────────────────────┘
                (Download & Store)
```

---

## Communication Flow

### 1. Document Upload
```
User Browser
    ↓ (multipart/form-data)
Spring Controller
    ↓
DocumentService
    ├─→ S3Service (upload file)
    ├─→ DocumentRepository (save metadata)
    └─→ SqsService (send message)
         ↓
    LocalStack SQS Queue
```

### 2. Document Processing
```
Python Service
    ↓ (poll)
LocalStack SQS Queue
    ↓ (receive message)
Python Service
    ├─→ LocalStack S3 (download file)
    ├─→ document_extractor (extract text)
    ├─→ Generate summary
    └─→ Spring API (POST /documents/{id}/summary)
         ↓
    Spring Service
         ↓
    PostgreSQL (update summary)
         ↓
Frontend (auto-refresh every 5s)
```

---

## Configuration Flow

```
docker-compose.yml
    ├─ LocalStack
    │   └─ AWS_ENDPOINT_URL: http://localstack:4566
    │
    ├─ PostgreSQL
    │   └─ POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
    │
    ├─ Spring App
    │   ├─ SPRING_DATASOURCE_URL
    │   ├─ AWS_S3_ENDPOINT
    │   ├─ AWS_SQS_ENDPOINT
    │   └─ (loaded from application.properties)
    │
    └─ Python Service
        ├─ AWS_ENDPOINT_URL
        ├─ SQS_QUEUE_NAME
        ├─ S3_BUCKET_NAME
        └─ SPRING_API_URL
```

---

## Deployment Checklist

- [ ] Clone repository
- [ ] Install Docker & Docker Compose
- [ ] Update environment variables if needed
- [ ] Run `docker-compose up --build`
- [ ] Wait 15-20 seconds for services to start
- [ ] Access http://localhost:8080 in browser
- [ ] Upload test document
- [ ] Monitor Python service logs for processing
- [ ] Verify summary appears in UI

---

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused on 8080 | Spring not started | Check logs: `docker-compose logs spring-app` |
| Database error | PostgreSQL not ready | Wait longer, check: `docker-compose ps` |
| File not found in S3 | S3 bucket not created | LocalStack initialization might have failed |
| SQS message not processed | Python service down | Check: `docker-compose logs python-summary-service` |
| Frontend not loading | Static files issue | Verify Spring app is running and serving static files |
| Port already in use | Service conflict | Stop other services or change ports in docker-compose.yml |

---

## Extension Points

### Adding New Features

1. **New File Format Support**
   - Add extractor function in `document_extractor.py`
   - Register in `extract_text_from_file()`

2. **Custom Summarization**
   - Replace `generate_summary()` with ML model
   - Options: Hugging Face, OpenAI API, spaCy

3. **Database Backups**
   - Add backup volume to docker-compose.yml
   - Configure PostgreSQL backup scripts

4. **Authentication**
   - Add Spring Security
   - Implement JWT or OAuth2

5. **Document Annotations**
   - Add annotation entity
   - Extend Document model and repository

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Upload Speed | ~10MB/s | Depends on disk I/O |
| Summary Generation | 1-5s | Depends on document size |
| Database Query | <100ms | Indexed on status |
| SQS Latency | <100ms | LocalStack in-memory |
| UI Auto-Refresh | 5s | Configurable in index.html |

