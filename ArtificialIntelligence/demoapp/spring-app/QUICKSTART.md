# 🚀 Document Upload & Summary System - Quick Start Guide

## 📋 Prerequisites

Ensure you have installed:
- **Docker** (version 20.10+)
- **Docker Compose** (version 1.29+)
- **bash** or compatible shell
- **4GB+ RAM** available
- **2GB+ disk space**

### Verify Installation
```bash
docker --version
docker-compose --version
```

---

## ⚡ Fastest Start (60 seconds)

### Option 1: Automated Script (Recommended)

```bash
# Navigate to project directory
cd document-upload-system

# Make script executable
chmod +x start.sh

# Run startup script
./start.sh
```

This script will:
- ✅ Check Docker installation
- ✅ Verify port availability
- ✅ Start all services
- ✅ Wait for services to be ready
- ✅ Open browser automatically

### Option 2: Manual Startup

```bash
# Build and start services
docker-compose up --build -d

# Wait for initialization
sleep 15

# View logs to verify startup
docker-compose logs -f
```

---

## 📍 Access the Application

Once services are running:

- **🌐 Web Interface**: http://localhost:8080
- **📡 API Base URL**: http://localhost:8080/api
- **🐘 Database**: localhost:5432 (user: docuser, pass: docpass123)
- **☁️ LocalStack**: http://localhost:4566

---

## 🧪 Quick Test

### Upload Your First Document

1. **Open browser**: http://localhost:8080
2. **Select file**: Use the upload area (drag & drop or click)
3. **Add metadata**: (optional)
   - Title: "My First Document"
   - Author: "Test User"
   - Description: "Testing the system"
4. **Click**: "Upload Document"
5. **Wait**: 5-10 seconds for processing
6. **View**: Summary appears automatically

### Test with cURL

```bash
# Upload a test document
curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@your_file.pdf" \
  -F "title=Test Document" \
  -F "author=Test User"

# Get all documents
curl http://localhost:8080/api/documents

# Get specific document
curl http://localhost:8080/api/documents/1
```

---

## 📁 Project File Structure

```
📦 document-upload-system/
├── 📄 README.md                              # Full documentation
├── 📄 API_DOCUMENTATION.md                   # API reference
├── 📄 ARCHITECTURE.md                        # System architecture
├── 📄 QUICKSTART.md                          # This file
│
├── 🐳 docker-compose.yml                     # Service orchestration
├── 📜 start.sh                               # Quick start script
│
├── 🚀 spring-app/                            # Java Backend
│   ├── Dockerfile
│   ├── pom.xml                               # Dependencies
│   └── src/main/
│       ├── java/com/example/documentupload/
│       │   ├── DocumentUploadApplication.java
│       │   ├── config/AwsConfig.java
│       │   ├── controller/DocumentController.java
│       │   ├── model/Document.java
│       │   ├── repository/DocumentRepository.java
│       │   ├── service/(S3, Sqs, Document)Service.java
│       │   └── dto/DocumentUploadRequest.java
│       └── resources/
│           ├── application.properties
│           └── static/index.html              # Frontend
│
└── 🐍 python-service/                        # Python Processor
    ├── Dockerfile
    ├── main.py                               # SQS consumer
    ├── document_extractor.py                 # Text extraction
    └── requirements.txt
```

---

## 🎯 Key Services

| Service | Port | Purpose |
|---------|------|---------|
| Spring Boot API | 8080 | REST API & Web UI |
| PostgreSQL | 5432 | Document metadata storage |
| LocalStack (S3) | 4566 | Document file storage |
| LocalStack (SQS) | 4566 | Message queue |
| Python Service | N/A | Background processing |

---

## 🛠️ Common Commands

### View Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f spring-app
docker-compose logs -f python-summary-service
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose stop
```

### Restart Services
```bash
docker-compose restart spring-app
```

### Stop & Remove All Services
```bash
docker-compose down
```

### Clean Everything (including data)
```bash
docker-compose down -v
```

---

## ✨ Features

### Frontend (HTML/Tailwind CSS)
- ✅ Modern, responsive design
- ✅ Drag-and-drop file upload
- ✅ Real-time status updates
- ✅ Document list with summaries
- ✅ Multi-file support
- ✅ Metadata capture

### Backend (Spring Boot)
- ✅ REST API for document management
- ✅ PostgreSQL integration
- ✅ S3 file storage
- ✅ SQS message queuing
- ✅ CORS support
- ✅ Auto-database initialization

### Processing (Python)
- ✅ SQS message consumption
- ✅ PDF text extraction
- ✅ DOCX/Word document support
- ✅ Excel spreadsheet support
- ✅ Text file support
- ✅ Automatic summary generation
- ✅ REST API integration

### Infrastructure (LocalStack + Docker)
- ✅ Local AWS S3 simulation
- ✅ Local AWS SQS simulation
- ✅ PostgreSQL database
- ✅ Docker Compose orchestration
- ✅ Health checks and auto-restart
- ✅ Volume persistence

---

## 📊 Supported File Types

| Format | Extension | Notes |
|--------|-----------|-------|
| PDF | .pdf | Full text extraction |
| Word | .docx | Paragraph-based extraction |
| Excel | .xlsx | All sheets combined |
| Text | .txt | Direct reading |
| PowerPoint | .pptx | Limited support |

**Maximum file size**: 100MB

---

## 🔄 Document Workflow

```
Step 1: UPLOAD
User selects file → Uploads with metadata

Step 2: STORE
File saved to S3 → Metadata saved to Database

Step 3: QUEUE
Message sent to SQS → Marked as "UPLOADED"

Step 4: PROCESS
Python service polls SQS → Downloads file from S3

Step 5: EXTRACT
Text extracted from file → Status: "PROCESSING"

Step 6: SUMMARIZE
Summary generated → REST API called

Step 7: UPDATE
Database updated with summary → Status: "COMPLETED"

Step 8: DISPLAY
Frontend auto-refreshes → Summary shown to user
```

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check if ports are in use
lsof -i :8080  # Spring
lsof -i :5432  # PostgreSQL
lsof -i :4566  # LocalStack

# Kill process using port (example for port 8080)
lsof -ti:8080 | xargs kill -9
```

### Frontend Won't Load
```bash
# Verify Spring is running
curl http://localhost:8080

# Check Spring logs
docker-compose logs spring-app | tail -20
```

### Documents Not Processing
```bash
# Check Python service logs
docker-compose logs python-summary-service

# Verify SQS queue
docker-compose exec localstack aws --endpoint-url=http://localhost:4566 sqs list-queues
```

### Database Connection Issues
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U docuser

# View database contents
docker-compose exec postgres psql -U docuser -d document_db -c "SELECT * FROM documents;"
```

### File Upload Fails
```bash
# Check file size limit
grep "max-file-size" spring-app/src/main/resources/application.properties

# Verify S3 bucket exists
docker-compose exec localstack aws --endpoint-url=http://localhost:4566 s3 ls
```

---

## 📈 Performance Tuning

### Increase Upload Limit
Edit `spring-app/src/main/resources/application.properties`:
```properties
spring.servlet.multipart.max-file-size=500MB
spring.servlet.multipart.max-request-size=500MB
```

### Enable Debug Logging
Edit `application.properties`:
```properties
logging.level.com.example.documentupload=DEBUG
```

### Increase Memory
Edit `docker-compose.yml`:
```yaml
services:
  spring-app:
    environment:
      - JAVA_OPTS=-Xmx2G -Xms512M
```

---

## 🔐 Security Considerations

For production deployment, implement:

- [ ] API authentication (JWT/OAuth2)
- [ ] File upload validation
- [ ] Input sanitization
- [ ] HTTPS/SSL encryption
- [ ] Database encryption
- [ ] Access control (RBAC)
- [ ] Rate limiting
- [ ] Audit logging

---

## 📚 Documentation

- **[README.md](README.md)** - Comprehensive project overview
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API endpoints & examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & components

---

## 🎓 Learning Resources

### Understanding the Stack
- **Spring Boot**: https://spring.io/
- **Docker**: https://docs.docker.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **AWS SDK**: https://docs.aws.amazon.com/sdk-for-java/
- **Python boto3**: https://boto3.amazonaws.com/

### Sample API Calls

**Upload Document**
```bash
curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "author=John Doe" \
  -F "description=Test document"
```

**Get All Documents**
```bash
curl http://localhost:8080/api/documents | jq .
```

**Monitor Processing**
```bash
while true; do
  curl -s http://localhost:8080/api/documents | jq '.[] | {id, fileName, status, summary}'
  sleep 2
done
```

---

## 💡 Next Steps

1. **Test Upload**: Upload a sample PDF to verify everything works
2. **Monitor Logs**: Watch Python service process documents
3. **Review Code**: Examine service implementations
4. **Customize**: Add features or modify summarization logic
5. **Deploy**: Adapt for production environment

---

## 🆘 Need Help?

### Check Logs
```bash
docker-compose logs -f [service-name]
```

### Verify Health
```bash
docker-compose ps
curl http://localhost:8080/api/documents
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up --build
```

### View Application Errors
- Spring logs: `docker-compose logs spring-app`
- Python logs: `docker-compose logs python-summary-service`
- Database logs: `docker-compose logs postgres`

---

## 📝 Notes

- Services take 15-20 seconds to fully initialize
- Frontend auto-refreshes document list every 5 seconds
- Summaries are generated within 1-5 seconds of upload
- All data is stored locally (Docker volumes)
- No authentication implemented by default

---

**Ready to get started? Run the quick start command above! 🚀**
