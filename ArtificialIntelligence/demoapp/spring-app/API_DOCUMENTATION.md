# Document Upload System - API Documentation

## Base URL

```
http://localhost:8080/api
```

## Endpoints

### 1. Upload Document

**Endpoint:** `POST /documents/upload`

**Description:** Upload a new document with optional metadata

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | multipart/form-data | Yes | Document file (PDF, DOCX, XLSX, TXT, PPTX) |
| title | string | No | Document title |
| author | string | No | Author name |
| description | string | No | Document description |

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@report.pdf" \
  -F "title=Q4 Report" \
  -F "author=John Doe" \
  -F "description=Quarterly financial report"
```

**Response (201 Created):**
```json
{
  "id": 1,
  "fileName": "report.pdf",
  "s3Key": "550e8400-e29b-41d4-a716-446655440000/report.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "title": "Q4 Report",
  "description": "Quarterly financial report",
  "author": "John Doe",
  "summary": null,
  "status": "UPLOADED",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

---

### 2. Get All Documents

**Endpoint:** `GET /documents`

**Description:** Retrieve all documents with their metadata and summaries

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/documents \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "fileName": "report.pdf",
    "s3Key": "550e8400-e29b-41d4-a716-446655440000/report.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "title": "Q4 Report",
    "description": "Quarterly financial report",
    "author": "John Doe",
    "summary": "This document contains detailed financial analysis...",
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:35:00"
  },
  {
    "id": 2,
    "fileName": "presentation.pptx",
    "s3Key": "550e8400-e29b-41d4-a716-446655440001/presentation.pptx",
    "fileSize": 2048000,
    "contentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "title": "Product Launch",
    "description": null,
    "author": "Jane Smith",
    "summary": null,
    "status": "PROCESSING",
    "createdAt": "2024-01-15T10:45:00",
    "updatedAt": "2024-01-15T10:45:00"
  }
]
```

---

### 3. Get Document by ID

**Endpoint:** `GET /documents/{id}`

**Description:** Retrieve specific document details

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Document ID |

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/documents/1 \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "fileName": "report.pdf",
  "s3Key": "550e8400-e29b-41d4-a716-446655440000/report.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "title": "Q4 Report",
  "description": "Quarterly financial report",
  "author": "John Doe",
  "summary": "This document contains detailed financial analysis showing Q4 performance...",
  "status": "COMPLETED",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:35:00"
}
```

**Error Response (404 Not Found):**
```json
null
```

---

### 4. Update Document Summary

**Endpoint:** `POST /documents/{id}/summary`

**Description:** Manually update or override a document's summary

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Document ID |
| body | string (plain text) | Yes | Summary text |

**Content-Type:** `text/plain` or send as plain string in body

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/documents/1/summary \
  -H "Content-Type: text/plain" \
  -d "This is a manually updated summary of the document."
```

**Response (200 OK):**
```json
{
  "id": 1,
  "fileName": "report.pdf",
  "s3Key": "550e8400-e29b-41d4-a716-446655440000/report.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "title": "Q4 Report",
  "description": "Quarterly financial report",
  "author": "John Doe",
  "summary": "This is a manually updated summary of the document.",
  "status": "COMPLETED",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:40:00"
}
```

---

## Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Document created successfully |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Document not found |
| 500 | Internal Server Error | Server error |

## Document Status Values

| Status | Description |
|--------|-------------|
| UPLOADED | File received and queued for processing |
| PROCESSING | Summary generation in progress |
| COMPLETED | Summary successfully generated |
| FAILED | Processing error occurred |

## Examples & Workflows

### Workflow 1: Upload and Monitor Progress

```bash
# Step 1: Upload document
RESPONSE=$(curl -s -X POST http://localhost:8080/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "author=John")

# Step 2: Extract document ID
DOC_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

# Step 3: Poll for completion
while true; do
  STATUS=$(curl -s http://localhost:8080/api/documents/$DOC_ID | grep -o '"status":"[^"]*"')
  echo "Status: $STATUS"
  
  if [[ $STATUS == *"COMPLETED"* ]]; then
    echo "Processing complete!"
    break
  fi
  
  sleep 5
done

# Step 4: Get final document
curl -s http://localhost:8080/api/documents/$DOC_ID | jq .
```

### Workflow 2: Batch Upload

```bash
#!/bin/bash

for file in *.pdf; do
  echo "Uploading $file..."
  curl -X POST http://localhost:8080/api/documents/upload \
    -F "file=@$file" \
    -F "title=$file" \
    -F "author=Batch Upload"
done
```

### Workflow 3: Export All Summaries

```bash
# Get all documents and export summaries to CSV
curl -s http://localhost:8080/api/documents | jq '.[] | [.id, .fileName, .title, .summary] | @csv' > summaries.csv
```

## Error Handling

### Common Errors

**Error:** File too large
```json
{
  "error": "File size exceeds maximum allowed size"
}
```

**Solution:** Increase `spring.servlet.multipart.max-file-size` in `application.properties`

---

**Error:** Unsupported file type
```json
{
  "error": "File type not supported"
}
```

**Solution:** Check that file extension is in the supported list

---

**Error:** Database connection failed
```
Caused by: java.sql.SQLException: Connection refused
```

**Solution:** Ensure PostgreSQL container is running: `docker-compose ps`

---

## Rate Limiting & Performance

- **Upload Limit:** No hard limit, but limited by available disk space
- **Query Limit:** No rate limiting implemented
- **File Size Limit:** 100MB (configurable)
- **Concurrent Uploads:** Limited by system resources

## Authentication & Security

Currently, **no authentication is implemented** in this version.

For production deployment, consider adding:
- API key authentication
- JWT tokens
- RBAC (Role-Based Access Control)
- HTTPS/TLS encryption
- Input validation & sanitization

## Support

For issues with API calls:
1. Check service logs: `docker-compose logs spring-app`
2. Verify LocalStack is running: `docker-compose ps`
3. Test connectivity: `curl http://localhost:8080/api/documents`
