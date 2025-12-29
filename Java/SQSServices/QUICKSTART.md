# Quick Start Guide - Spring Boot SQS with LocalStack

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Application
```bash
docker-compose up --build
```

### Step 2: Publish a Message
```bash
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World",
    "type": "INFO",
    "priority": "MEDIUM"
  }'
```

### Step 3: Read the Message
```bash
curl http://localhost:8080/api/sqs/read
```

## 📝 Message Schema

**Required Fields:**
- `content` (string) - The message content
- `type` (string) - Message type/category

**Optional Fields:**
- `id` (string) - Auto-generated UUID if not provided
- `priority` (string) - Priority level
- `timestamp` (datetime) - Auto-generated if not provided
- `metadata` (object) - Additional metadata
  - `source` (string)
  - `userId` (string)
  - `tags` (array of strings)

## 🧪 Quick Test

Run the included test script:
```bash
./test-api.sh
```

Or import `Spring-SQS-API.postman_collection.json` into Postman.

## 🔍 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sqs/publish` | Publish message to queue |
| GET | `/api/sqs/read` | Read next message from queue |
| GET | `/api/sqs/health` | Health check and queue status |

## 📦 What's Included

- ✅ Spring Boot 3.5.5 application
- ✅ LocalStack SQS integration
- ✅ Docker Compose setup
- ✅ Message DTO with validation
- ✅ Auto queue creation
- ✅ Comprehensive error handling
- ✅ Test scripts and Postman collection

## 🛠️ Technology Stack

- **Java:** 21
- **Spring Boot:** 3.5.5
- **AWS SDK:** 2.29.31
- **LocalStack:** Latest
- **Build Tool:** Maven
- **Container:** Docker

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.

## 🐛 Troubleshooting

**App won't start?**
```bash
docker-compose logs spring-app
```

**Queue not found?**
```bash
docker-compose restart spring-app
```

**Port conflicts?**
Edit `docker-compose.yml` and change port mappings.

## 🎯 Example Messages

### Simple Message
```json
{
  "content": "Simple message",
  "type": "INFO"
}
```

### Complete Message
```json
{
  "content": "Full featured message",
  "type": "NOTIFICATION",
  "priority": "HIGH",
  "metadata": {
    "source": "api",
    "userId": "user123",
    "tags": ["important", "urgent"]
  }
}
```

---

**Happy Coding!** 🎉
