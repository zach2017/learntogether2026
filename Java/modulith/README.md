# Spring Modulith Document Processor

A modular Spring Boot application that processes documents through upload, AI summarization (via Ollama), and location mapping.

## 🏗️ Architecture

This application uses **Spring Modulith** to organize code into three main modules:

1. **Upload Module** - Handles file uploads with pluggable storage backends
2. **Summarization Module** - Uses Ollama AI to generate summaries and extract metadata
3. **Location Mapping Module** - Extracts and geocodes location references

Modules communicate via Spring Events for loose coupling.

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- Ollama installed and running (for AI features)
- One of the following storage options configured:
  - File System (default, no setup needed)
  - AWS S3
  - Azure Blob Storage
  - Google Cloud Storage

## 🚀 Quick Start

### 1. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download

# Start Ollama and pull a model
ollama serve
ollama pull llama2
```

### 2. Clone and Build

```bash
git clone <your-repo>
cd document-processor
mvn clean install
```

### 3. Configure Application

Create `src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

# Choose storage type: filesystem, s3, azure, or gcs
storage:
  type: filesystem

# Ollama Configuration
ollama:
  base-url: http://localhost:11434
  model: llama2

logging:
  level:
    com.example.documentprocessor: DEBUG
```

### 4. Create Static HTML

Place the upload HTML file at:
```
src/main/resources/static/index.html
```

### 5. Run the Application

```bash
mvn spring-boot:run
```

Visit: `http://localhost:8080`

## ⚙️ Storage Configuration

### File System (Default)

No additional configuration needed. Files are stored in `./upload-dir/`.

```yaml
storage:
  type: filesystem
```

### AWS S3

```yaml
storage:
  type: s3

aws:
  access-key: YOUR_ACCESS_KEY
  secret-key: YOUR_SECRET_KEY
  region: us-east-1
  s3:
    bucket: your-bucket-name
```

Add AWS credentials to environment variables:
```bash
export AWS_ACCESS_KEY=your_key
export AWS_SECRET_KEY=your_secret
```

### Azure Blob Storage

```yaml
storage:
  type: azure

azure:
  storage:
    connection-string: ${AZURE_STORAGE_CONNECTION_STRING}
    container: documents
```

```bash
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=..."
```

### Google Cloud Storage

```yaml
storage:
  type: gcs

gcs:
  project-id: ${GCP_PROJECT_ID}
  bucket: your-bucket-name
```

Set up Google Cloud credentials:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export GCP_PROJECT_ID=your-project-id
```

## 🧪 Testing

Upload a sample text file with content like:

```
Annual Report 2024

Our company expanded operations to New York, London, and Tokyo this year.
We opened new offices in Paris and Sydney, while maintaining our headquarters in Berlin.

Key achievements include...
```

The application will:
1. ✅ Upload the file to configured storage
2. 🤖 Generate an AI summary via Ollama
3. 📍 Extract and geocode locations (New York, London, Tokyo, Paris, Sydney, Berlin)

Check the logs to see the processing:

```
INFO - Processing document for summarization: abc-123
INFO - Summary generated for document: abc-123
INFO - Extracting locations from document: abc-123
INFO - Found 6 locations in document: abc-123
INFO - Location: New York at (40.7128, -74.0060)
INFO - Location: London at (51.5074, -0.1278)
```

## 📁 Project Structure

```
src/
├── main/
│   ├── java/com/example/documentprocessor/
│   │   ├── DocumentProcessorApplication.java
│   │   ├── upload/
│   │   │   ├── DocumentUploadedEvent.java
│   │   │   ├── StorageService.java
│   │   │   ├── UploadService.java
│   │   │   ├── UploadController.java
│   │   │   └── storage/
│   │   │       ├── FileSystemStorageService.java
│   │   │       ├── S3StorageService.java
│   │   │       ├── AzureStorageService.java
│   │   │       └── GoogleCloudStorageService.java
│   │   ├── summarization/
│   │   │   ├── DocumentSummary.java
│   │   │   ├── OllamaService.java
│   │   │   └── SummarizationService.java
│   │   └── locationmapping/
│   │       ├── GeoPoint.java
│   │       └── LocationMappingService.java
│   └── resources/
│       ├── application.yml
│       └── static/
│           └── index.html
```

## 🔧 API Endpoints

### Upload Document

```http
POST /api/upload
Content-Type: multipart/form-data

file: [binary file data]
```

**Response:**
```json
{
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "File uploaded successfully"
}
```

## 🎯 Features

- **Modular Architecture** - Clean separation of concerns using Spring Modulith
- **Event-Driven** - Modules communicate via domain events
- **Pluggable Storage** - Easy to switch between storage backends
- **AI-Powered** - Ollama integration for summarization and metadata extraction
- **Location Intelligence** - Automatic extraction and geocoding of place names
- **Modern UI** - Responsive HTML5 upload interface with drag-and-drop

## 🔍 Extending the Application

### Add a New Storage Provider

1. Implement `StorageService` interface
2. Add `@ConditionalOnProperty` for your storage type
3. Update `application.yml` with configuration

### Customize Location Extraction

Edit `LocationMappingService.extractLocations()` to:
- Use NLP libraries for better entity recognition
- Integrate with geocoding APIs (Google Maps, OpenStreetMap)
- Support address parsing

### Enhance Summarization

Modify `OllamaService` to:
- Use different Ollama models
- Customize prompts for domain-specific summaries
- Extract structured data (entities, dates, amounts)

## 🐛 Troubleshooting

**Ollama connection failed:**
- Ensure Ollama is running: `ollama serve`
- Check base URL in configuration
- Verify model is pulled: `ollama list`

**Storage errors:**
- Check credentials for cloud providers
- Verify bucket/container exists
- Ensure proper IAM permissions

**Upload fails:**
- Check file size limits in `application.yml`
- Verify file permissions for filesystem storage

## 📚 Additional Resources

- [Spring Modulith Documentation](https://spring.io/projects/spring-modulith)
- [Ollama Documentation](https://ollama.ai/docs)
- [AWS S3 Java SDK](https://docs.aws.amazon.com/sdk-for-java/)
- [Azure Storage SDK](https://docs.microsoft.com/azure/storage/)

## 📄 License

MIT License - feel free to use and modify as needed!