# JSON Message Schema Examples

## 📋 Complete Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MessageDTO",
  "type": "object",
  "required": ["content", "type"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier (auto-generated if not provided)"
    },
    "content": {
      "type": "string",
      "minLength": 1,
      "description": "The message content (REQUIRED)"
    },
    "type": {
      "type": "string",
      "description": "Message type/category (REQUIRED)",
      "enum": ["INFO", "ALERT", "NOTIFICATION", "WARNING", "ERROR"]
    },
    "priority": {
      "type": "string",
      "description": "Priority level (optional)",
      "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp (auto-generated if not provided)"
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata (optional)",
      "properties": {
        "source": {
          "type": "string",
          "description": "Source system or application"
        },
        "userId": {
          "type": "string",
          "description": "User identifier"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Array of tags for categorization"
        }
      }
    }
  }
}
```

## 📝 Example Messages

### 1. Minimal Valid Message
```json
{
  "content": "Hello World",
  "type": "INFO"
}
```

**Server Auto-Adds:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hello World",
  "type": "INFO",
  "timestamp": "2025-11-25T15:30:45.123Z"
}
```

---

### 2. Message with Priority
```json
{
  "content": "Database backup completed successfully",
  "type": "INFO",
  "priority": "LOW"
}
```

---

### 3. Alert Message
```json
{
  "content": "CPU usage exceeded 90% threshold",
  "type": "ALERT",
  "priority": "HIGH"
}
```

---

### 4. Message with Basic Metadata
```json
{
  "content": "User registration completed",
  "type": "NOTIFICATION",
  "priority": "MEDIUM",
  "metadata": {
    "source": "user-service",
    "userId": "user-12345"
  }
}
```

---

### 5. Complete Message with All Fields
```json
{
  "id": "custom-id-12345",
  "content": "Order #54321 has been shipped",
  "type": "NOTIFICATION",
  "priority": "HIGH",
  "timestamp": "2025-11-25T10:00:00Z",
  "metadata": {
    "source": "order-service",
    "userId": "customer-789",
    "tags": ["order", "shipping", "customer-notification"]
  }
}
```

---

### 6. Error Notification
```json
{
  "content": "Payment processing failed: insufficient funds",
  "type": "ERROR",
  "priority": "CRITICAL",
  "metadata": {
    "source": "payment-gateway",
    "userId": "user-456",
    "tags": ["payment", "error", "requires-action"]
  }
}
```

---

### 7. Warning Message
```json
{
  "content": "SSL certificate expires in 7 days",
  "type": "WARNING",
  "priority": "MEDIUM",
  "metadata": {
    "source": "security-monitor",
    "tags": ["security", "ssl", "expiration"]
  }
}
```

---

### 8. Info Message with Multiple Tags
```json
{
  "content": "Daily report generated successfully",
  "type": "INFO",
  "priority": "LOW",
  "metadata": {
    "source": "reporting-service",
    "tags": ["report", "daily", "automated", "analytics"]
  }
}
```

---

## 🔴 Invalid Messages (Will Return 400 Bad Request)

### Missing Required Field: content
```json
{
  "type": "INFO"
}
```
**Error:** "Content cannot be blank"

---

### Missing Required Field: type
```json
{
  "content": "Test message"
}
```
**Error:** "Type cannot be null"

---

### Empty Content
```json
{
  "content": "",
  "type": "INFO"
}
```
**Error:** "Content cannot be blank"

---

## 📤 API Response Format

### Success Response (After Publishing)
```json
{
  "success": true,
  "messageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Message published successfully",
  "queueMessageCount": 3
}
```

### Success Response (Reading Message)
```json
{
  "success": true,
  "hasMessage": true,
  "message": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Test message",
    "type": "INFO",
    "priority": "MEDIUM",
    "timestamp": "2025-11-25T15:30:45.123Z",
    "metadata": {
      "source": "test",
      "userId": "user123",
      "tags": ["example"]
    }
  },
  "remainingMessages": 2
}
```

### Empty Queue Response
```json
{
  "success": true,
  "hasMessage": false,
  "message": null,
  "info": "No messages available in the queue"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to publish message to SQS"
}
```

---

## 🎯 Field-by-Field Guide

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String (UUID) | No | Auto-generated | Unique message identifier |
| `content` | String | **Yes** | - | The actual message text |
| `type` | String | **Yes** | - | Message category/type |
| `priority` | String | No | null | Priority level |
| `timestamp` | DateTime | No | Current time | When message was created |
| `metadata` | Object | No | null | Additional information |
| `metadata.source` | String | No | null | Origin system |
| `metadata.userId` | String | No | null | Associated user |
| `metadata.tags` | String[] | No | null | Categorization tags |

---

## 🧪 Testing Different Scenarios

### Scenario 1: Quick Test Message
```bash
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{"content":"Quick test","type":"INFO"}'
```

### Scenario 2: High Priority Alert
```bash
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{"content":"System critical alert","type":"ALERT","priority":"CRITICAL"}'
```

### Scenario 3: User Activity Notification
```bash
curl -X POST http://localhost:8080/api/sqs/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content":"User logged in from new device",
    "type":"NOTIFICATION",
    "priority":"MEDIUM",
    "metadata":{
      "source":"auth-service",
      "userId":"user789",
      "tags":["security","login","new-device"]
    }
  }'
```

---

## 💡 Best Practices

1. **Always provide meaningful content**
   - ✅ "Payment processed successfully for order #12345"
   - ❌ "Success"

2. **Use appropriate types**
   - INFO: General information
   - ALERT: Requires attention
   - NOTIFICATION: User notifications
   - WARNING: Potential issues
   - ERROR: Actual errors

3. **Set priority wisely**
   - CRITICAL: Immediate action required
   - HIGH: Important, handle soon
   - MEDIUM: Normal priority
   - LOW: Can be processed when convenient

4. **Include useful metadata**
   - Source: Helps track message origin
   - UserId: Links to specific users
   - Tags: Enables categorization and filtering

5. **Keep content concise but descriptive**
   - Include essential details
   - Avoid excessive length
   - Use metadata for additional context

---

## 🔄 Message Lifecycle

```
1. Client sends JSON → POST /api/sqs/publish
2. Server validates JSON
3. Server adds ID and timestamp
4. Server converts to JSON string
5. Server sends to SQS queue
6. Message stored in LocalStack
7. Client reads → GET /api/sqs/read
8. Server retrieves from SQS
9. Server parses JSON to DTO
10. Server deletes from queue
11. Server returns to client
```

---

**Ready to send your first message?** Use the examples above! 🚀
