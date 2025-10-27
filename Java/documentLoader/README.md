# File Upload Microservice - Architectural Outline

## 1. System Overview

A Spring Boot microservice that provides secure file upload capabilities to AWS S3 with JWT-based OAuth authentication and asynchronous event publishing to a message queue system.

### Core Features
- RESTful API for file upload operations
- JWT OAuth 2.0 authentication and authorization
- AWS S3 integration for file storage
- Event-driven architecture with Kafka/RabbitMQ
- Comprehensive metadata tracking
- Async processing with status notifications

---

## 2. Technology Stack

### Core Framework
- **Java**: 17 or 21 (LTS versions)
- **Spring Boot**: 3.2.x
- **Spring Web**: REST API implementation
- **Spring Security**: OAuth 2.0 Resource Server with JWT

### AWS Integration
- **AWS SDK for Java**: 2.x
- **S3 Client**: For file operations

### Messaging
- **Option A - Kafka**: Spring Kafka
- **Option B - RabbitMQ**: Spring AMQP

### Database (for metadata)
- **Spring Data JPA**
- **PostgreSQL** or **MySQL**

### Additional Libraries
- **Lombok**: Reduce boilerplate code
- **MapStruct**: Object mapping
- **SpringDoc OpenAPI**: API documentation

---

## 3. High-Level Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTPS + JWT
       ▼
┌─────────────────────────────────────────┐
│        API Gateway / Load Balancer      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│     File Upload Microservice             │
│  ┌────────────────────────────────────┐  │
│  │   Security Layer (JWT Filter)      │  │
│  └────────────┬───────────────────────┘  │
│               ▼                           │
│  ┌────────────────────────────────────┐  │
│  │      REST Controllers              │  │
│  └────────────┬───────────────────────┘  │
│               ▼                           │
│  ┌────────────────────────────────────┐  │
│  │      Service Layer                 │  │
│  └────┬───────────────────────┬───────┘  │
│       │                       │           │
│       ▼                       ▼           │
│  ┌─────────┐           ┌──────────────┐  │
│  │   S3    │           │   Message    │  │
│  │ Client  │           │   Producer   │  │
│  └────┬────┘           └──────┬───────┘  │
│       │                       │           │
└───────┼───────────────────────┼───────────┘
        │                       │
        ▼                       ▼
   ┌─────────┐          ┌──────────────┐
   │  AWS S3 │          │ Kafka/RabbitMQ│
   │ Bucket  │          │    Cluster    │
   └─────────┘          └──────────────┘
        │
        │
   ┌─────────┐
   │Database │
   │(Metadata)│
   └─────────┘
```

---

## 4. Component Architecture

### 4.1 Security Layer

#### JWT Authentication Filter
```
SecurityConfiguration
├── JWT Token Filter
│   ├── Extract JWT from Authorization header
│   ├── Validate token signature
│   ├── Extract claims (user, roles, permissions)
│   └── Set SecurityContext
└── OAuth 2.0 Resource Server Configuration
```

**Key Components:**
- `JwtAuthenticationFilter`: Custom filter for JWT validation
- `JwtTokenProvider`: Token parsing and validation
- `OAuth2ResourceServerConfigurer`: Spring Security configuration

**Security Flow:**
1. Client sends request with `Authorization: Bearer <JWT_TOKEN>`
2. Filter intercepts and validates token
3. Extract user details and authorities
4. Populate SecurityContext
5. Allow/Deny request based on authorities

### 4.2 REST API Layer

#### Endpoints

**File Upload Endpoint**
```
POST /api/v1/files/upload
Headers: 
  - Authorization: Bearer <JWT_TOKEN>
  - Content-Type: multipart/form-data
Body: 
  - file: MultipartFile (required)
  - metadata: JSON (optional)
Response: 
  - 201 Created
  - Location header with file URL
  - JSON body with file details and upload ID
```

**Multiple Files Upload**
```
POST /api/v1/files/upload/batch
Headers: 
  - Authorization: Bearer <JWT_TOKEN>
  - Content-Type: multipart/form-data
Body: 
  - files: List<MultipartFile>
  - metadata: JSON (optional)
Response: 
  - 201 Created
  - JSON array with upload details
```

**Get Upload Status**
```
GET /api/v1/files/upload/{uploadId}/status
Headers: 
  - Authorization: Bearer <JWT_TOKEN>
Response: 
  - 200 OK
  - Upload status and metadata
```

**Download File**
```
GET /api/v1/files/{fileId}/download
Headers: 
  - Authorization: Bearer <JWT_TOKEN>
Response: 
  - 200 OK
  - Pre-signed S3 URL or file stream
```

### 4.3 Service Layer

#### File Upload Service
```
FileUploadService
├── uploadFile(MultipartFile file, FileMetadata metadata, User user)
│   ├── Validate file (size, type, content)
│   ├── Generate unique file key
│   ├── Upload to S3
│   ├── Save metadata to database
│   ├── Publish UPLOAD_STARTED event
│   ├── Publish UPLOAD_COMPLETED event
│   └── Return FileUploadResponse
│
├── uploadMultipleFiles(List<MultipartFile> files, User user)
│   ├── Validate all files
│   ├── Generate batch ID
│   ├── Upload files concurrently
│   ├── Publish events for each file
│   └── Return BatchUploadResponse
│
└── getUploadStatus(String uploadId, User user)
    ├── Retrieve from database
    └── Return status information
```

#### S3 Storage Service
```
S3StorageService
├── uploadFile(byte[] data, String key, String contentType)
│   ├── Create PutObjectRequest
│   ├── Upload to configured bucket
│   └── Return S3 object URL
│
├── generatePresignedUrl(String key, Duration expiration)
│   ├── Create GetObjectRequest
│   ├── Generate presigned URL
│   └── Return URL
│
└── deleteFile(String key)
    └── Delete object from bucket
```

#### Event Publishing Service
```
EventPublishingService
├── publishUploadStartedEvent(FileUploadEvent event)
├── publishUploadCompletedEvent(FileUploadEvent event)
├── publishUploadFailedEvent(FileUploadEvent event)
└── publishBatchUploadStatusEvent(BatchUploadEvent event)
```

### 4.4 Data Models

#### File Metadata Entity
```java
@Entity
@Table(name = "file_metadata")
class FileMetadata {
    @Id
    private String id;                    // UUID
    private String originalFilename;
    private String s3Key;
    private String s3Bucket;
    private Long fileSize;
    private String contentType;
    private String uploadedBy;            // User ID from JWT
    private UploadStatus status;
    private LocalDateTime uploadedAt;
    private LocalDateTime completedAt;
    private String checksum;              // MD5/SHA256
    private Map<String, String> customMetadata;
    private String batchId;               // For batch uploads
}

enum UploadStatus {
    INITIATED,
    IN_PROGRESS,
    COMPLETED,
    FAILED
}
```

#### Event Payload Models

**File Upload Event**
```java
class FileUploadEvent {
    private String eventId;               // UUID
    private String uploadId;
    private String filename;
    private Long fileSize;
    private String contentType;
    private String s3Key;
    private String s3Bucket;
    private UploadStatus status;
    private String uploadedBy;
    private LocalDateTime timestamp;
    private Map<String, String> metadata;
    private String errorMessage;          // If failed
}
```

**Batch Upload Event**
```java
class BatchUploadEvent {
    private String eventId;
    private String batchId;
    private Integer totalFiles;
    private Integer completedFiles;
    private Integer failedFiles;
    private List<String> uploadIds;
    private BatchStatus status;
    private String uploadedBy;
    private LocalDateTime timestamp;
}
```

### 4.5 Message Queue Integration

#### Kafka Configuration (Option A)

**Topics:**
- `file-upload-started`
- `file-upload-completed`
- `file-upload-failed`
- `batch-upload-status`

**Producer Configuration:**
```java
@Configuration
class KafkaProducerConfig {
    @Bean
    public ProducerFactory<String, FileUploadEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaBootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(config);
    }
}
```

#### RabbitMQ Configuration (Option B)

**Exchanges and Queues:**
- Exchange: `file-upload-exchange` (Topic)
- Routing Keys:
  - `file.upload.started`
  - `file.upload.completed`
  - `file.upload.failed`
  - `batch.upload.status`

**Producer Configuration:**
```java
@Configuration
class RabbitMQConfig {
    @Bean
    public TopicExchange fileUploadExchange() {
        return new TopicExchange("file-upload-exchange");
    }
    
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
```

---

## 5. Configuration Structure

### 5.1 Application Configuration

**application.yml**
```yaml
spring:
  application:
    name: file-upload-service
  
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 200MB
  
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${JWT_ISSUER_URI}
          jwk-set-uri: ${JWT_JWK_SET_URI}
  
  datasource:
    url: jdbc:postgresql://localhost:5432/fileupload
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

# AWS Configuration
aws:
  s3:
    bucket-name: ${S3_BUCKET_NAME}
    region: ${AWS_REGION:us-east-1}
  credentials:
    access-key: ${AWS_ACCESS_KEY}
    secret-key: ${AWS_SECRET_KEY}

# Kafka Configuration (Option A)
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all

# RabbitMQ Configuration (Option B)
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USERNAME}
    password: ${RABBITMQ_PASSWORD}

# File Upload Configuration
file-upload:
  allowed-extensions:
    - pdf
    - jpg
    - jpeg
    - png
    - doc
    - docx
    - xls
    - xlsx
  max-file-size: 104857600  # 100MB in bytes
  virus-scan-enabled: true
```

---

## 6. Project Structure

```
file-upload-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/fileupload/
│   │   │       ├── FileUploadServiceApplication.java
│   │   │       │
│   │   │       ├── config/
│   │   │       │   ├── SecurityConfig.java
│   │   │       │   ├── AwsS3Config.java
│   │   │       │   ├── KafkaProducerConfig.java
│   │   │       │   └── AsyncConfig.java
│   │   │       │
│   │   │       ├── controller/
│   │   │       │   ├── FileUploadController.java
│   │   │       │   └── HealthCheckController.java
│   │   │       │
│   │   │       ├── service/
│   │   │       │   ├── FileUploadService.java
│   │   │       │   ├── FileUploadServiceImpl.java
│   │   │       │   ├── S3StorageService.java
│   │   │       │   ├── S3StorageServiceImpl.java
│   │   │       │   ├── EventPublishingService.java
│   │   │       │   └── EventPublishingServiceImpl.java
│   │   │       │
│   │   │       ├── repository/
│   │   │       │   └── FileMetadataRepository.java
│   │   │       │
│   │   │       ├── model/
│   │   │       │   ├── entity/
│   │   │       │   │   └── FileMetadata.java
│   │   │       │   ├── dto/
│   │   │       │   │   ├── FileUploadRequest.java
│   │   │       │   │   ├── FileUploadResponse.java
│   │   │       │   │   ├── BatchUploadResponse.java
│   │   │       │   │   └── UploadStatusResponse.java
│   │   │       │   └── event/
│   │   │       │       ├── FileUploadEvent.java
│   │   │       │       └── BatchUploadEvent.java
│   │   │       │
│   │   │       ├── security/
│   │   │       │   ├── JwtAuthenticationFilter.java
│   │   │       │   ├── JwtTokenProvider.java
│   │   │       │   └── SecurityUser.java
│   │   │       │
│   │   │       ├── exception/
│   │   │       │   ├── GlobalExceptionHandler.java
│   │   │       │   ├── FileUploadException.java
│   │   │       │   ├── InvalidFileException.java
│   │   │       │   └── S3StorageException.java
│   │   │       │
│   │   │       └── util/
│   │   │           ├── FileValidator.java
│   │   │           └── FileKeyGenerator.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           └── V1__create_file_metadata_table.sql
│   │
│   └── test/
│       └── java/
│           └── com/company/fileupload/
│               ├── controller/
│               ├── service/
│               └── integration/
│
├── pom.xml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 7. Security Implementation

### 7.1 JWT Token Validation Flow

```
1. Client Request
   └── Authorization: Bearer <JWT>

2. JwtAuthenticationFilter
   ├── Extract token from header
   ├── Validate token structure
   ├── Verify signature using public key
   ├── Check expiration
   ├── Extract claims (sub, roles, permissions)
   └── Create Authentication object

3. SecurityContextHolder
   └── Store authentication

4. Authorization
   ├── Method Security (@PreAuthorize)
   └── URL-based security
```

### 7.2 Security Configuration Example

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health").permitAll()
                .requestMatchers("/api/v1/files/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter()))
            );
        return http.build();
    }
}
```

### 7.3 Required JWT Claims

```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "roles": ["USER", "FILE_UPLOADER"],
  "permissions": ["file:upload", "file:read"],
  "iss": "https://auth.company.com",
  "exp": 1730000000,
  "iat": 1729990000
}
```

---

## 8. API Request/Response Examples

### 8.1 Single File Upload

**Request:**
```http
POST /api/v1/files/upload HTTP/1.1
Host: api.company.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{
  "description": "Q4 Financial Report",
  "category": "finance",
  "tags": ["quarterly", "report", "2024"]
}
------WebKitFormBoundary--
```

**Response:**
```json
{
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "document.pdf",
  "originalFilename": "document.pdf",
  "fileSize": 2048576,
  "contentType": "application/pdf",
  "s3Key": "uploads/2025/10/27/550e8400-e29b-41d4-a716-446655440000_document.pdf",
  "s3Bucket": "company-file-uploads",
  "status": "COMPLETED",
  "uploadedAt": "2025-10-27T10:30:00Z",
  "uploadedBy": "user-id-123",
  "checksum": "5d41402abc4b2a76b9719d911017c592",
  "downloadUrl": "https://api.company.com/api/v1/files/550e8400-e29b-41d4-a716-446655440000/download",
  "metadata": {
    "description": "Q4 Financial Report",
    "category": "finance",
    "tags": ["quarterly", "report", "2024"]
  }
}
```

### 8.2 Event Published to Kafka/RabbitMQ

**Topic/Queue:** `file-upload-completed`

**Event Payload:**
```json
{
  "eventId": "660e8400-e29b-41d4-a716-446655440001",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "document.pdf",
  "fileSize": 2048576,
  "contentType": "application/pdf",
  "s3Key": "uploads/2025/10/27/550e8400-e29b-41d4-a716-446655440000_document.pdf",
  "s3Bucket": "company-file-uploads",
  "status": "COMPLETED",
  "uploadedBy": "user-id-123",
  "timestamp": "2025-10-27T10:30:00Z",
  "metadata": {
    "description": "Q4 Financial Report",
    "category": "finance",
    "tags": ["quarterly", "report", "2024"]
  }
}
```

---

## 9. Error Handling

### Error Response Format
```json
{
  "timestamp": "2025-10-27T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "File size exceeds maximum allowed size of 100MB",
  "path": "/api/v1/files/upload",
  "traceId": "abc123def456"
}
```

### Common Error Scenarios
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User lacks required permissions
- **400 Bad Request**: Invalid file type or size
- **413 Payload Too Large**: File exceeds size limit
- **500 Internal Server Error**: S3 upload failure, database error
- **503 Service Unavailable**: Message queue unavailable

---

## 10. Deployment Considerations

### 10.1 Environment Variables
```
# Database
DB_USERNAME=fileupload_user
DB_PASSWORD=<secure-password>
DB_HOST=postgres.internal
DB_PORT=5432

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY=<access-key>
AWS_SECRET_KEY=<secret-key>
S3_BUCKET_NAME=company-file-uploads

# JWT
JWT_ISSUER_URI=https://auth.company.com
JWT_JWK_SET_URI=https://auth.company.com/.well-known/jwks.json

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092

# Or RabbitMQ
RABBITMQ_HOST=rabbitmq.internal
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=fileupload
RABBITMQ_PASSWORD=<secure-password>
```

### 10.2 Docker Deployment

**Dockerfile:**
```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/file-upload-service.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 10.3 Health Checks
```
GET /actuator/health
GET /actuator/health/liveness
GET /actuator/health/readiness
```

---

## 11. Monitoring and Observability

### Metrics to Track
- Upload success/failure rate
- Average upload time
- File size distribution
- S3 operation latency
- Message queue publish latency
- JWT validation failures
- Active uploads count

### Logging Strategy
- Use structured logging (JSON format)
- Include correlation ID in all logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Key events to log:
  - Upload initiated
  - Upload completed
  - Upload failed
  - Event published
  - Authentication failures

---

## 12. Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Load balancer distribution
- Database connection pooling
- S3 automatically scales

### Async Processing
- Use `@Async` for S3 uploads
- Background threads for large files
- Event publishing in separate thread pool

### Performance Optimization
- Multipart upload for large files (>5GB)
- Streaming upload to S3
- Database indexing on uploadedBy, status, uploadedAt
- Caching presigned URLs

---

## 13. Testing Strategy

### Unit Tests
- Service layer logic
- JWT token validation
- File validation rules
- Event payload construction

### Integration Tests
- Controller endpoints with security
- S3 upload/download operations
- Database operations
- Message queue publishing

### Contract Tests
- API contract validation
- Event schema validation

---

## 14. Dependencies (pom.xml highlights)

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- AWS SDK -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.20.0</version>
    </dependency>
    
    <!-- Kafka (Option A) -->
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
    
    <!-- RabbitMQ (Option B) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-amqp</artifactId>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    
    <!-- Utilities -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
```

---

## 15. Future Enhancements

- Virus scanning integration (ClamAV)
- Image thumbnail generation
- File compression before upload
- Multiple storage backends (Azure Blob, GCS)
- Retry mechanism for failed uploads
- Audit logging
- File versioning
- Soft delete with retention policy
- Rate limiting per user
- WebSocket notifications for upload progress

---

## Conclusion

This architecture provides a robust, scalable, and secure foundation for a file upload microservice. The separation of concerns, event-driven design, and comprehensive security measures ensure the service can handle production workloads while maintaining data integrity and system observability.