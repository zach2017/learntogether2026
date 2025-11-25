# Spring Boot SQS Integration with LocalStack

This project demonstrates a Spring Boot 3.5.5 application that integrates with AWS SQS using LocalStack for local development.

## Features

- **Publish Message API**: POST endpoint to send JSON messages to SQS queue
- **Read Message API**: GET endpoint to retrieve messages from SQS queue
- **Message DTO**: Strongly-typed JSON schema for messages
- **LocalStack Integration**: Local SQS for development and testing
- **Docker Compose**: Complete containerized setup

## Architecture

```
┌─────────────────┐         ┌──────────────┐
│  Spring Boot    │◄───────►│  LocalStack  │
│  Application    │         │     SQS      │
│  (Port 8080)    │         │  (Port 4566) │
└─────────────────┘         └──────────────┘
```

## Prerequisites

- Docker and Docker Compose
- Java 21 (if running locally without Docker)
- Maven (if running locally without Docker)

## Project Structure

```
.
├── docker-compose.yml
├── Dockerfile
├── pom.xml
└── src
    └── main
        ├── java
        │   └── com
        │       └── example
        │           └── springsqsapp
        │               ├── SpringSqsApplication.java
        │               ├── config
        │               │   └── AwsSqsConfig.java
        │               ├── controller
        │               │   └── SqsController.java
        │               ├── dto
        │               │   └── MessageDTO.java
        │               └── service
        │                   └── SqsService.java
        └── resources
            └── application.yml
```

## Quick Start

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 2. Verify Services are Running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f spring-app
```

### 3. Test the Health Endpoint

```bash
curl http://localhost:8080/api/sqs/health
```

## API Endpoints

### 1. Publish Message to SQS

**Endpoint:** `POST /api/sqs/publish`

**Request Body:**
```json
{
  "content": "Hello from Spring Boot",
  "type": "NOTIFICATION",
  "priority": "HIGH",
  "metadata": {
    "source": "web-app",
    "userId": "user123",
    "tags": ["important", "urgent"]
  }
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test message",
    "type": "INFO",
    "priority": "MEDIUM",
    "metadata": {
      "source": "curl-test",
      "userId": "testUser",
      "tags": ["test", "demo"]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "messageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Message published successfully",
  "queueMessageCount": 1
}
```

### 2. Read Message from SQS

**Endpoint:** `GET /api/sqs/read`

**Example using curl:**
```bash
curl http://localhost:8080/api/sqs/read
```

**Response (when message available):**
```json
{
  "success": true,
  "hasMessage": true,
  "message": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "This is a test message",
    "type": "INFO",
    "priority": "MEDIUM",
    "timestamp": "2025-11-25T10:30:00",
    "metadata": {
      "source": "curl-test",
      "userId": "testUser",
      "tags": ["test", "demo"]
    }
  },
  "remainingMessages": 0
}
```

**Response (when queue is empty):**
```json
{
  "success": true,
  "hasMessage": false,
  "message": null,
  "info": "No messages available in the queue"
}
```

### 3. Health Check

**Endpoint:** `GET /api/sqs/health`

**Example:**
```bash
curl http://localhost:8080/api/sqs/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "SQS Integration Service",
  "queueMessageCount": 0
}
```

## Message DTO Schema

The application uses a strongly-typed DTO for messages:

```java
{
  "id": "string (UUID, auto-generated if not provided)",
  "content": "string (required)",
  "type": "string (required)",
  "priority": "string (optional)",
  "timestamp": "datetime (ISO format, auto-generated if not provided)",
  "metadata": {
    "source": "string (optional)",
    "userId": "string (optional)",
    "tags": ["array of strings (optional)"]
  }
}
```

## Testing Workflow

### Send Multiple Messages

```bash
# Message 1
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{"content": "First message", "type": "INFO", "priority": "LOW"}'

# Message 2
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{"content": "Second message", "type": "ALERT", "priority": "HIGH"}'

# Message 3
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{"content": "Third message", "type": "NOTIFICATION", "priority": "MEDIUM"}'
```

### Read All Messages

```bash
# Read messages one by one
curl http://localhost:8080/api/sqs/read
curl http://localhost:8080/api/sqs/read
curl http://localhost:8080/api/sqs/read
```

## Configuration

### Environment Variables

You can customize the application using environment variables in `docker-compose.yml`:

- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ENDPOINT`: LocalStack endpoint (default: http://localstack:4566)
- `AWS_ACCESS_KEY_ID`: AWS access key (default: test)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (default: test)
- `SQS_QUEUE_NAME`: Queue name (default: spring-message-queue)

### Application Properties

Configuration in `src/main/resources/application.yml`:

```yaml
sqs:
  queue-name: spring-message-queue
  max-messages: 1                # Number of messages to retrieve per read
  wait-time-seconds: 5           # Long polling wait time
  visibility-timeout: 30         # Message visibility timeout
```

## LocalStack SQS

The LocalStack container provides a local AWS SQS instance for testing. You can interact with it directly using AWS CLI:

```bash
# List queues
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Get queue attributes
aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/spring-message-queue \
  --attribute-names All

# Send message directly via AWS CLI
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/spring-message-queue \
  --message-body "Test message from CLI"
```

## Stopping the Application

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes
docker-compose down -v
```

## Troubleshooting

### Queue Not Found Error

If you see "Queue does not exist" errors, the queue may not have been created. Check the logs:

```bash
docker-compose logs spring-app
```

The application automatically creates the queue on startup.

### Connection Refused

If the Spring Boot app can't connect to LocalStack:

1. Ensure LocalStack is running: `docker-compose ps`
2. Check LocalStack logs: `docker-compose logs localstack`
3. Verify network connectivity between containers

### Port Already in Use

If port 8080 or 4566 is already in use, modify the ports in `docker-compose.yml`:

```yaml
services:
  spring-app:
    ports:
      - "8081:8080"  # Change host port
```

## Development

### Running Locally (without Docker)

1. Start LocalStack:
```bash
docker run -d -p 4566:4566 localstack/localstack
```

2. Build and run the Spring Boot app:
```bash
./mvnw clean install
./mvnw spring-boot:run
```

### Hot Reload

For development with hot reload, use Spring Boot DevTools (already included in dependencies):

```bash
./mvnw spring-boot:run
```

## License

MIT License
