# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Docker Network                         │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   Spring Boot App    │      │     LocalStack       │    │
│  │   (spring-sqs-app)   │◄────►│    (localstack-sqs)  │    │
│  │                      │      │                      │    │
│  │   Port: 8080        │      │   Port: 4566        │    │
│  └──────────────────────┘      └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
         ▲                                ▲
         │                                │
         │ HTTP REST API                  │ AWS SQS Protocol
         │                                │
         ▼                                ▼
    ┌─────────┐                    ┌──────────┐
    │ Client  │                    │   AWS    │
    │ (curl,  │                    │   CLI    │
    │Postman) │                    │(optional)│
    └─────────┘                    └──────────┘
```

## Component Flow

### Publishing a Message

```
1. Client Request
   │
   ▼
2. SqsController.publishMessage()
   │ - Validates request body
   │ - Maps to MessageDTO
   ▼
3. SqsService.publishMessage()
   │ - Sets ID and timestamp if missing
   │ - Converts to JSON
   │ - Sends to SQS
   ▼
4. LocalStack SQS
   │ - Stores message in queue
   │ - Returns message ID
   ▼
5. Response to Client
   - Success status
   - Message ID
   - Queue count
```

### Reading a Message

```
1. Client Request
   │
   ▼
2. SqsController.readMessage()
   │
   ▼
3. SqsService.readMessage()
   │ - Polls SQS queue
   │ - Waits up to 5 seconds
   ▼
4. LocalStack SQS
   │ - Returns message if available
   │ - Returns empty if not
   ▼
5. SqsService Processing
   │ - Parses JSON to DTO
   │ - Deletes message from queue
   ▼
6. Response to Client
   - Message data (if available)
   - Empty response (if not)
```

## Application Layers

```
┌────────────────────────────────────────┐
│         Controller Layer               │
│  (REST API - HTTP endpoints)           │
│  - SqsController                       │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│         Service Layer                  │
│  (Business Logic)                      │
│  - SqsService                          │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│         Data Layer                     │
│  (DTO & Models)                        │
│  - MessageDTO                          │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│         Configuration Layer            │
│  (AWS SQS Setup)                       │
│  - AwsSqsConfig                        │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│         AWS SDK Layer                  │
│  (SqsClient)                           │
└────────────────────────────────────────┘
```

## Data Flow - Message Structure

### Input (POST /api/sqs/publish)
```json
{
  "content": "string",
  "type": "string",
  "priority": "string",
  "metadata": {
    "source": "string",
    "userId": "string",
    "tags": ["string"]
  }
}
```

### Processing (SqsService)
```
1. Auto-generate ID (UUID)
2. Auto-generate timestamp
3. Validate required fields
4. Convert to JSON string
5. Send to SQS
```

### Storage (SQS Queue)
```
Queue: spring-message-queue
├── Message 1 (visibility timeout: 30s)
├── Message 2 (visibility timeout: 30s)
└── Message 3 (visibility timeout: 30s)
```

### Output (GET /api/sqs/read)
```json
{
  "success": true,
  "hasMessage": true,
  "message": {
    "id": "uuid",
    "content": "string",
    "type": "string",
    "priority": "string",
    "timestamp": "2025-11-25T10:30:00",
    "metadata": {...}
  },
  "remainingMessages": 2
}
```

## Key Design Decisions

### 1. Message Deletion Strategy
- **Automatic deletion** after successful read
- Ensures messages are processed only once
- Prevents duplicate processing

### 2. Long Polling
- Wait time: 5 seconds
- Reduces empty responses
- More efficient than short polling

### 3. Visibility Timeout
- Set to 30 seconds
- Allows time for processing
- Prevents other consumers from reading

### 4. Error Handling
- Comprehensive try-catch blocks
- Detailed logging at each layer
- Meaningful error messages to client

### 5. DTO Validation
- Jakarta Validation annotations
- Required field enforcement
- Type safety through strong typing

## Environment Configuration

### Docker Compose Variables
```yaml
AWS_REGION: us-east-1
AWS_ENDPOINT: http://localstack:4566
AWS_ACCESS_KEY_ID: test
AWS_SECRET_ACCESS_KEY: test
SQS_QUEUE_NAME: spring-message-queue
```

### Application Properties
```yaml
sqs.max-messages: 1
sqs.wait-time-seconds: 5
sqs.visibility-timeout: 30
```

## Scalability Considerations

### Current Setup (Development)
- Single instance
- LocalStack (not production-ready)
- In-memory queue

### Production Recommendations
1. **Replace LocalStack with AWS SQS**
   - Real AWS credentials
   - Production endpoint
   - Region-specific setup

2. **Multiple Consumers**
   - Scale horizontally
   - Increase visibility timeout
   - Implement dead-letter queue

3. **Monitoring**
   - CloudWatch metrics
   - Custom logging
   - Queue depth alerts

4. **Performance**
   - Batch operations
   - Async processing
   - Connection pooling

## Security Notes

### Current Setup (Development)
- Default "test" credentials
- No encryption
- Local network only

### Production Security
- IAM roles and policies
- Encrypted queues (SSE)
- VPC endpoints
- Secrets management
- HTTPS endpoints

## Testing Strategy

### Unit Tests
- Service layer logic
- DTO validation
- JSON serialization

### Integration Tests
- API endpoints
- SQS operations
- End-to-end flows

### Manual Testing
- Postman collection
- Test script (test-api.sh)
- Health checks

## Monitoring Points

1. **Queue Depth** - Number of messages waiting
2. **Message Age** - Time since message creation
3. **API Response Times** - Latency metrics
4. **Error Rates** - Failed operations
5. **Throughput** - Messages per second

---

This architecture provides a solid foundation for development and can be easily adapted for production use.
