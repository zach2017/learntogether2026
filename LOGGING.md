# Spring Boot 3.5.x Logging Configuration Guide
## For S3, HTTP File Uploads, CompletableFuture, and Controller Actions

---

## Table of Contents
1. [Overview](#overview)
2. [Configuration Files](#configuration-files)
3. [Setup Instructions](#setup-instructions)
4. [Log Levels Explained](#log-levels-explained)
5. [Loggers Configured](#loggers-configured)
6. [Implementation Examples](#implementation-examples)
7. [Log Files Generated](#log-files-generated)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This logging configuration provides comprehensive tracking for:

- **S3 Operations**: Detailed AWS SDK logging for S3 uploads/downloads
- **HTTP File Uploads**: Multipart file upload tracking and HTTP client operations
- **CompletableFuture/Async**: Thread pool execution and async task monitoring
- **Controller Actions**: Request/response logging for all REST endpoints
- **Performance**: Thread information and timing details

### Key Features

- Multiple log files for easy filtering (s3.log, uploads.log, controller.log, etc.)
- Async appenders for high-throughput scenarios
- Rolling file policies to prevent disk space issues
- Environment-specific profiles (dev, prod)
- Color-coded console output
- Structured error logging

---

## Configuration Files

### 1. **application-logging.properties** (Properties Format)
Standard Spring Boot properties format. Use when you prefer `.properties` files.

**Location**: `src/main/resources/application-logging.properties`

```properties
logging.level.root=INFO
logging.level.software.amazon.awssdk.services.s3=DEBUG
# ... more properties
```

### 2. **application-logging.yml** (YAML Format)
More readable YAML format. Use when you prefer `.yml` files.

**Location**: `src/main/resources/application-logging.yml`

```yaml
logging:
  level:
    root: INFO
    software.amazon.awssdk.services.s3: DEBUG
  # ... more config
```

### 3. **logback-spring.xml** (Advanced Configuration)
Most powerful option with fine-grained control. Supports async appenders, custom filters, multiple file outputs.

**Location**: `src/main/resources/logback-spring.xml`

---

## Setup Instructions

### Step 1: Choose Configuration Format

Pick ONE of the following approaches:

#### Option A: Using application.properties (Simplest)

```bash
# Copy the properties file to your resources
cp application-logging.properties src/main/resources/
```

Then in your `application.properties`:
```properties
spring.config.import=optional:classpath:application-logging.properties
```

#### Option B: Using application.yml (Recommended)

```bash
# Copy the YAML file to your resources
cp application-logging.yml src/main/resources/
```

Then in your `application.yml`:
```yaml
spring:
  config:
    import: optional:classpath:application-logging.yml
```

#### Option C: Using logback-spring.xml (Most Control)

```bash
# Copy the Logback config
cp logback-spring.xml src/main/resources/
```

No additional configuration needed. Spring Boot automatically uses `logback-spring.xml`.

### Step 2: Update Package Names

Replace all occurrences of `com.yourcompany` with your actual package:

```bash
# For macOS/Linux
sed -i 's/com.yourcompany/com.actualcompany/g' logback-spring.xml

# For Windows
(Get-Content logback-spring.xml) -replace 'com.yourcompany', 'com.actualcompany' | Set-Content logback-spring.xml
```

### Step 3: Create Log Directories

```bash
mkdir -p logs
```

Spring Boot will create log files automatically, but ensure the directory exists.

### Step 4: Maven Dependencies

Ensure you have the required dependencies in `pom.xml`:

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- AWS SDK v2 (Recommended) -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
    </dependency>

    <!-- Logback (included by default) -->
    <!-- Already included in spring-boot-starter-logging -->

    <!-- SLF4J (included by default) -->
    <!-- Already included in spring-boot-starter-logging -->

    <!-- Commons Logging for HTTP Client Logging (Optional) -->
    <dependency>
        <groupId>commons-logging</groupId>
        <artifactId>commons-logging</artifactId>
        <version>1.3.3</version>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>bom</artifactId>
            <version>2.24.10</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Step 5: Configure AWS S3 Client Bean

```java
@Configuration
public class S3Config {
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.US_EAST_1)
                .build();
    }
}
```

---

## Log Levels Explained

| Level | Usage | When to Use |
|-------|-------|-----------|
| **TRACE** | Very detailed diagnostic info | Rare, only for deep debugging |
| **DEBUG** | Detailed diagnostic info | Development, detailed issue investigation |
| **INFO** | Informational messages | Normal operation, important events |
| **WARN** | Warning messages | Potentially harmful situations |
| **ERROR** | Error events | Runtime errors, failures |

### Recommended Log Levels by Component

```
Spring Framework: INFO (unless debugging Spring internals)
AWS SDK: INFO in production, DEBUG in development
Your Application Code: DEBUG in development, INFO in production
HTTP Clients: DEBUG for upload troubleshooting
Database/Hibernate: DEBUG for query analysis
Controllers: DEBUG (always useful)
```

---

## Loggers Configured

### AWS/S3 Loggers

| Logger | Level | Purpose |
|--------|-------|---------|
| `software.amazon.awssdk` | INFO | AWS SDK root logger |
| `software.amazon.awssdk.core` | DEBUG | Core AWS operations |
| `software.amazon.awssdk.services.s3` | DEBUG | S3-specific operations |
| `software.amazon.awssdk.auth` | DEBUG | Authentication/authorization |
| `software.amazon.awssdk.http` | DEBUG | HTTP communication |

### HTTP Client Loggers

| Logger | Level | Purpose |
|--------|-------|---------|
| `org.apache.http` | DEBUG | Apache HttpClient |
| `org.apache.http.wire` | DEBUG | HTTP headers/body |
| `org.springframework.web.client` | DEBUG | RestTemplate |
| `reactor.netty.http.client` | DEBUG | Netty WebClient |

### File Upload Loggers

| Logger | Level | Purpose |
|--------|-------|---------|
| `org.springframework.web.multipart` | DEBUG | Multipart file handling |
| `com.yourcompany.service.FileUploadService` | DEBUG | Your upload service |

### Async/Threading Loggers

| Logger | Level | Purpose |
|--------|-------|---------|
| `org.springframework.scheduling` | DEBUG | Spring async scheduling |
| `java.util.concurrent` | DEBUG | Java concurrent utilities |

### Controller Loggers

| Logger | Level | Purpose |
|--------|-------|---------|
| `com.yourcompany.controller` | DEBUG | Your REST controllers |
| `org.springframework.web.servlet.mvc` | DEBUG | Spring MVC routing |

---

## Implementation Examples

### Example 1: S3 Upload with Logging

```java
@Service
public class S3Service {
    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);
    private final S3Client s3Client;

    public void uploadFile(String bucket, String key, Path filePath) {
        logger.debug("Starting S3 upload - Bucket: {}, Key: {}", bucket, key);
        
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            
            PutObjectResponse response = s3Client.putObject(request, filePath);
            
            logger.info("S3 upload successful - ETag: {}", response.eTag());
        } catch (Exception e) {
            logger.error("S3 upload failed - Error: {}", e.getMessage(), e);
            throw new RuntimeException("Upload failed", e);
        }
    }
}
```

**Output in logs/s3.log**:
```
2025-01-15 10:30:45.123 [main] DEBUG S3Service - Starting S3 upload - Bucket: my-bucket, Key: my-file.txt
2025-01-15 10:30:46.456 [main] DEBUG software.amazon.awssdk.services.s3 - Sending request...
2025-01-15 10:30:47.789 [main] INFO S3Service - S3 upload successful - ETag: "abc123def456"
```

### Example 2: File Upload Controller with Async

```java
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);
    private final FileUploadService uploadService;

    @PostMapping("/file-async")
    public CompletableFuture<ResponseEntity<String>> uploadFileAsync(
            @RequestParam("file") MultipartFile file) {
        
        logger.debug("Async upload request - FileName: {}, Size: {} bytes", 
                file.getOriginalFilename(), file.getSize());
        
        return uploadService.uploadFileAsync(file)
                .thenApply(result -> {
                    logger.info("Async upload completed - Result: {}", result);
                    return ResponseEntity.ok(result);
                })
                .exceptionally(ex -> {
                    logger.error("Async upload failed - Error: {}", ex.getMessage(), ex);
                    return ResponseEntity.internalServerError().build();
                });
    }
}
```

**Output in logs/controller.log**:
```
2025-01-15 11:00:00.000 [http-nio-8080-exec-1] DEBUG FileUploadController - Async upload request - FileName: document.pdf, Size: 2048576 bytes
2025-01-15 11:00:05.500 [upload-executor-1] INFO FileUploadController - Async upload completed - Result: uploaded successfully
```

### Example 3: CompletableFuture with Async Executor

```java
@Service
public class AsyncUploadService {
    private static final Logger logger = LoggerFactory.getLogger(AsyncUploadService.class);

    @Async("uploadExecutor")
    public CompletableFuture<String> uploadFileAsync(MultipartFile file) {
        logger.debug("Async method started - Thread: {}", Thread.currentThread().getName());
        
        try {
            // Simulate upload
            Thread.sleep(2000);
            logger.info("Upload completed - FileName: {}", file.getOriginalFilename());
            return CompletableFuture.completedFuture("Success");
        } catch (InterruptedException e) {
            logger.error("Upload interrupted - Error: {}", e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
```

**Output in logs/async-executor.log**:
```
2025-01-15 11:05:00.100 [upload-executor-2] DEBUG AsyncUploadService - Async method started - Thread: upload-executor-2
2025-01-15 11:05:02.150 [upload-executor-2] INFO AsyncUploadService - Upload completed - FileName: data.csv
```

---

## Log Files Generated

With logback-spring.xml, the following log files are created:

```
logs/
├── application.log              # Main application log
├── application.2025-01-15.1.gz # Rolled over archive
├── s3.log                       # S3 operations
├── uploads.log                  # File uploads & HTTP traffic
├── controller.log               # Controller actions
├── async-executor.log           # Async operations
└── errors.log                   # All errors
```

### Each File Contains

- **application.log**: Everything (DEBUG level)
- **s3.log**: S3-specific operations (DEBUG level)
- **uploads.log**: File uploads, HTTP clients (DEBUG level)
- **controller.log**: REST endpoint calls (DEBUG level)
- **async-executor.log**: Thread pool and CompletableFuture operations (DEBUG level)
- **errors.log**: Only ERROR and above (30-day retention)

---

## Best Practices

### 1. Development vs Production

```yaml
# application-dev.yml
spring:
  profiles:
    active: dev

logging:
  level:
    root: DEBUG
    com.yourcompany: DEBUG

---

# application-prod.yml
spring:
  profiles:
    active: prod

logging:
  level:
    root: INFO
    com.yourcompany: INFO
```

### 2. Structured Logging

Include relevant context:

```java
// Bad - unclear context
logger.info("Upload complete");

// Good - includes context
logger.info("S3 upload completed - Bucket: {}, Key: {}, Size: {} bytes, Duration: {}ms", 
        bucket, key, fileSize, duration);
```

### 3. Use Appropriate Levels

```java
// DEBUG: Detailed diagnostic information
logger.debug("Processing file upload request - FileName: {}, Thread: {}", name, thread);

// INFO: General informational messages
logger.info("File successfully uploaded to S3 - Key: {}", s3Key);

// WARN: Potentially harmful situations
logger.warn("Upload took longer than expected - Duration: {}ms", duration);

// ERROR: Runtime errors
logger.error("S3 upload failed - Bucket: {}, Error: {}", bucket, error, exception);
```

### 4. CompletableFuture Logging

```java
return CompletableFuture.supplyAsync(() -> {
    logger.debug("Task started - Thread: {}", Thread.currentThread().getName());
    // ... work ...
    logger.info("Task completed successfully");
    return result;
})
.exceptionally(ex -> {
    logger.error("Task failed - Error: {}", ex.getMessage(), ex);
    throw new RuntimeException(ex);
});
```

### 5. Monitor Log File Size

```properties
# application.properties
logging.file.max-size=10MB          # Rotate when file reaches 10MB
logging.file.max-history=10         # Keep last 10 files
logging.file.total-size-cap=100MB   # Stop rotating when total reaches 100MB
```

---

## Troubleshooting

### Problem: S3 logs not appearing

**Solution**: Check AWS SDK logger is configured:

```yaml
logging:
  level:
    software.amazon.awssdk.services.s3: DEBUG
```

### Problem: HTTP logs not showing details

**Solution**: Ensure HTTP client logger is enabled:

```yaml
logging:
  level:
    org.apache.http: DEBUG
    org.apache.http.wire: DEBUG
```

### Problem: Async operations not logged

**Solution**: Verify thread pool executor is configured with logging:

```java
@Bean
public Executor uploadExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setThreadNamePrefix("upload-executor-");
    executor.initialize();
    return executor;
}
```

### Problem: Log files not created

**Solution**: Ensure logs directory exists and is writable:

```bash
mkdir -p logs
chmod 755 logs
```

### Problem: Too much logging output

**Solution**: Increase log levels to INFO or WARN:

```yaml
logging:
  level:
    software.amazon.awssdk: INFO  # Change from DEBUG
    org.apache.http: INFO          # Change from DEBUG
```

### Problem: Application startup is slow

**Solution**: Reduce logging output by raising levels or using async appenders:

```xml
<!-- In logback-spring.xml -->
<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
    <queueSize>512</queueSize>
    <discardingThreshold>0</discardingThreshold>
    <appender-ref ref="FILE"/>
</appender>
```

---

## Configuration Cheat Sheet

### Quick Enable/Disable Specific Loggers

```yaml
# Enable S3 debug logging
logging.level.software.amazon.awssdk.services.s3: DEBUG

# Disable too verbose HTTP client logging
logging.level.org.apache.http.wire: WARN

# Enable controller request/response logging
logging.level.com.yourcompany.controller: DEBUG

# Enable async executor logging
logging.level.org.springframework.scheduling: DEBUG
```

### Performance Tuning

```properties
# For high-throughput systems, use async appenders
logging.async.queue-size=2048
logging.async.shutdown-timeout=10

# Reduce file I/O overhead
logging.file.max-history=5
logging.file.total-size-cap=50MB
```

---

## References

- [Spring Boot Logging Documentation](https://docs.spring.io/spring-boot/docs/3.5.x/reference/html/features.html#features.logging)
- [Logback Configuration](https://logback.qos.ch/manual/configuration.html)
- [AWS SDK v2 Logging](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/)
- [SLF4J Documentation](https://www.slf4j.org/)

---

## Summary

This comprehensive logging setup provides:

✅ Detailed S3 operation tracking  
✅ HTTP file upload monitoring  
✅ CompletableFuture/async operation logging  
✅ Controller action tracing  
✅ Organized log files by component  
✅ Production-ready configuration  
✅ Easy troubleshooting and debugging  

Choose the configuration format (properties, YAML, or XML) that best fits your team's preferences, update package names, and you're ready to go!