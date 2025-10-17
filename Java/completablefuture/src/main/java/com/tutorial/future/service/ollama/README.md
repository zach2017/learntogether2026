# Spring Boot CRUD Architecture Tutorial

## Overview

This tutorial explains the layered architecture pattern used in Spring Boot applications, demonstrating best practices for building maintainable, scalable enterprise applications.

## Architecture Layers

The application follows a **4-tier architecture** that separates concerns:

```
Client/Browser
     ↓
Controller Layer (REST API)
     ↓
Service Layer (Business Logic)
     ↓
Repository Layer (Data Access)
     ↓
Database (PostgreSQL)
```

---

## 1. Entity Class (`OllamaSummary`)

### Purpose
Represents the database table structure as a Java object (Object-Relational Mapping).

### How It Works
```java
@Entity                    // Marks this as a JPA entity
@Table(name = "ollama_summary")  // Maps to database table
public class OllamaSummary {
    
    @Id                    // Primary key
    private String docId;
    
    @Column(columnDefinition = "TEXT")  // PostgreSQL TEXT type
    private String docMetadata;
    
    private String docSummary;
}
```

### Key Annotations
- **@Entity**: Tells JPA this class maps to a database table
- **@Table**: Specifies the exact table name in the database
- **@Id**: Marks the primary key field
- **@Column**: Customizes column properties (nullable, length, type)
- **@Data**: Lombok generates getters, setters, toString, equals, hashCode
- **@NoArgsConstructor / @AllArgsConstructor**: Lombok generates constructors

### Why Best Practice?
- **Single Responsibility**: Only concerned with database mapping
- **JPA Standard**: Works with any JPA-compliant ORM (Hibernate, EclipseLink)
- **Type Safety**: Compile-time checking prevents runtime errors
- **Automatic Table Creation**: JPA can auto-generate tables from entities

---

## 2. DTO Class (`OllamaSummaryDTO`)

### Purpose
Data Transfer Object - carries data between layers without exposing internal entity structure.

### How It Works
```java
public class OllamaSummaryDTO {
    private String docId;
    private String docMetadata;
    private String docSummary;
}
```

### Why Separate DTO from Entity?

**Problem Without DTO:**
```java
// ❌ Bad: Exposing entity directly
@GetMapping
public OllamaSummary get() {
    return repository.findById("123");
}
```

**Benefits of Using DTO:**

1. **Security**: Hide sensitive fields
   ```java
   // Entity might have internal fields
   private Date createdAt;
   private String internalNotes;
   
   // DTO only exposes what API consumers need
   ```

2. **API Stability**: Change database without breaking API
   ```java
   // Database changes from snake_case to camelCase
   // DTO keeps consistent API contract
   ```

3. **Avoid Lazy Loading Issues**
   ```java
   // Entity relationships might cause LazyInitializationException
   @OneToMany
   private List<Related> items;
   
   // DTO prevents serialization issues
   ```

4. **Flexible Data Shaping**
   ```java
   // Combine data from multiple entities
   public class OrderDTO {
       private String orderId;
       private String customerName;  // From Customer entity
       private int totalItems;       // Calculated field
   }
   ```

### Why Best Practice?
- **Decoupling**: API independent of database structure
- **Versioning**: Support multiple API versions simultaneously
- **Validation**: Apply different validation rules than entity
- **Performance**: Send only necessary data over network

---

## 3. Repository Layer (`OllamaSummaryRepository`)

### Purpose
Data Access Layer - handles all database operations.

### How It Works
```java
@Repository
public interface OllamaSummaryRepository 
        extends JpaRepository<OllamaSummary, String> {
    
    // Spring generates implementation automatically!
    Optional<OllamaSummary> findByDocId(String docId);
    List<OllamaSummary> findByDocMetadataContaining(String keyword);
}
```

### Built-in Methods (Free with JpaRepository)
```java
// Create/Update
save(entity)           // Insert or update
saveAll(entities)      // Batch save

// Read
findById(id)           // Get by primary key
findAll()              // Get all records
findAllById(ids)       // Get multiple by IDs
count()                // Count total records

// Delete
deleteById(id)         // Delete by primary key
delete(entity)         // Delete specific entity
deleteAll()            // Delete all records
```

### Custom Query Methods
Spring Data JPA generates queries from method names:

```java
// Method name → SQL query
findByDocId(String id)
// SELECT * FROM ollama_summary WHERE doc_id = ?

findByDocMetadataContaining(String keyword)
// SELECT * FROM ollama_summary WHERE doc_metadata LIKE %keyword%

findByDocIdAndDocSummaryNotNull(String id)
// SELECT * FROM ollama_summary WHERE doc_id = ? AND doc_summary IS NOT NULL
```

### Advanced Queries
```java
@Query("SELECT o FROM OllamaSummary o WHERE o.docMetadata LIKE %:keyword%")
List<OllamaSummary> searchMetadata(@Param("keyword") String keyword);

@Query(value = "SELECT * FROM ollama_summary WHERE doc_summary IS NOT NULL", 
       nativeQuery = true)
List<OllamaSummary> findAllWithSummary();
```

### Why Best Practice?
- **No Boilerplate**: Spring generates implementations
- **Type Safe**: Compile-time query validation
- **Database Agnostic**: Works with any SQL database
- **Transaction Management**: Automatic transaction handling
- **Testing**: Easy to mock for unit tests

---

## 4. Service Layer (`OllamaSummaryService`)

### Purpose
Business Logic Layer - contains application logic, orchestrates operations.

### How It Works
```java
@Service
@RequiredArgsConstructor  // Lombok injects dependencies
public class OllamaSummaryService {
    
    private final OllamaSummaryRepository repository;
    
    @Transactional
    public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
        // Business logic here
        OllamaSummary entity = toEntity(dto);
        OllamaSummary saved = repository.save(entity);
        return toDTO(saved);
    }
}
```

### Key Responsibilities

**1. Data Transformation**
```java
// Converts between Entity and DTO
private OllamaSummaryDTO toDTO(OllamaSummary entity) {
    return new OllamaSummaryDTO(
        entity.getDocId(),
        entity.getDocMetadata(),
        entity.getDocSummary()
    );
}
```

**2. Business Logic**
```java
public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
    // Validation
    if (dto.getDocId() == null || dto.getDocId().isEmpty()) {
        throw new IllegalArgumentException("DocId required");
    }
    
    // Business rule
    if (repository.existsById(dto.getDocId())) {
        throw new DuplicateException("DocId already exists");
    }
    
    // Save
    return toDTO(repository.save(toEntity(dto)));
}
```

**3. Transaction Management**
```java
@Transactional  // All operations in this method are atomic
public void updateMultiple(List<OllamaSummaryDTO> dtos) {
    for (OllamaSummaryDTO dto : dtos) {
        // If any operation fails, ALL rollback
        repository.save(toEntity(dto));
    }
}
```

**4. Orchestration**
```java
public OrderSummaryDTO processOrder(OrderDTO order) {
    // Coordinate multiple repositories
    OllamaSummary summary = summaryRepo.findById(order.getDocId());
    Customer customer = customerRepo.findById(order.getCustomerId());
    
    // Apply business logic
    summary.setProcessedBy(customer.getName());
    
    // Return combined result
    return new OrderSummaryDTO(summary, customer);
}
```

### Why Best Practice?
- **Single Responsibility**: Business logic separate from data access
- **Testability**: Mock repository to test business logic
- **Reusability**: Controllers can call same service methods
- **Transaction Boundaries**: Clear transaction scopes
- **Maintainability**: Changes to business rules in one place

---

## 5. Controller Layer (`OllamaSummaryController`)

### Purpose
API Layer - handles HTTP requests/responses, exposes REST endpoints.

### How It Works
```java
@RestController
@RequestMapping("/api/ollama-summary")
@RequiredArgsConstructor
public class OllamaSummaryController {
    
    private final OllamaSummaryService service;
    
    @PostMapping
    public ResponseEntity<OllamaSummaryDTO> create(
            @RequestBody OllamaSummaryDTO dto) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.create(dto));
    }
}
```

### Key Responsibilities

**1. HTTP Request Mapping**
```java
@GetMapping("/{docId}")              // GET /api/ollama-summary/123
@PostMapping                          // POST /api/ollama-summary
@PutMapping("/{docId}")              // PUT /api/ollama-summary/123
@DeleteMapping("/{docId}")           // DELETE /api/ollama-summary/123
```

**2. Request Parameter Extraction**
```java
@PathVariable String docId           // From URL path
@RequestBody OllamaSummaryDTO dto    // From request body (JSON)
@RequestParam String search          // From query string (?search=value)
```

**3. HTTP Status Codes**
```java
ResponseEntity.ok(data)                    // 200 OK
ResponseEntity.status(HttpStatus.CREATED)  // 201 Created
ResponseEntity.notFound()                  // 404 Not Found
ResponseEntity.noContent()                 // 204 No Content
ResponseEntity.badRequest()                // 400 Bad Request
```

**4. Request Validation**
```java
@PostMapping
public ResponseEntity<OllamaSummaryDTO> create(
        @Valid @RequestBody OllamaSummaryDTO dto) {
    // @Valid triggers validation
    return ResponseEntity.ok(service.create(dto));
}

// In DTO class
public class OllamaSummaryDTO {
    @NotNull(message = "DocId is required")
    @Size(min = 1, max = 255)
    private String docId;
    
    @NotEmpty(message = "Summary cannot be empty")
    private String docSummary;
}
```

### Why Best Practice?
- **Thin Controllers**: Delegate logic to service layer
- **RESTful Design**: Standard HTTP methods and status codes
- **Consistent API**: Uniform response structure
- **Error Handling**: Centralized exception handling
- **Documentation**: Easy to document with OpenAPI/Swagger

---

## Complete Request Flow Example

Let's trace a **CREATE** operation:

### 1. Client Sends Request
```http
POST /api/ollama-summary
Content-Type: application/json

{
  "docId": "DOC123",
  "docMetadata": "Important document",
  "docSummary": "Summary of document"
}
```

### 2. Controller Receives Request
```java
@PostMapping
public ResponseEntity<OllamaSummaryDTO> create(@RequestBody OllamaSummaryDTO dto) {
    // dto is automatically deserialized from JSON
    OllamaSummaryDTO created = service.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

### 3. Service Processes Business Logic
```java
@Transactional
public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
    // Convert DTO to Entity
    OllamaSummary entity = new OllamaSummary(
        dto.getDocId(),
        dto.getDocMetadata(),
        dto.getDocSummary()
    );
    
    // Save to database
    OllamaSummary saved = repository.save(entity);
    
    // Convert Entity back to DTO
    return new OllamaSummaryDTO(
        saved.getDocId(),
        saved.getDocMetadata(),
        saved.getDocSummary()
    );
}
```

### 4. Repository Saves to Database
```java
// Spring Data JPA generates SQL
repository.save(entity);

// Executes:
// INSERT INTO ollama_summary (doc_id, doc_metadata, doc_summary)
// VALUES ('DOC123', 'Important document', 'Summary of document')
```

### 5. Response Sent to Client
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "docId": "DOC123",
  "docMetadata": "Important document",
  "docSummary": "Summary of document"
}
```

---

## Why This Architecture?

### 1. Separation of Concerns
Each layer has a specific responsibility:
- **Controller**: HTTP communication
- **Service**: Business logic
- **Repository**: Data access
- **Entity**: Database mapping
- **DTO**: Data transfer

### 2. Testability
```java
// Unit test service without database
@Test
public void testCreate() {
    OllamaSummaryRepository mockRepo = mock(OllamaSummaryRepository.class);
    OllamaSummaryService service = new OllamaSummaryService(mockRepo);
    
    // Test business logic in isolation
}
```

### 3. Maintainability
Changes are localized:
- Database schema change → Only Entity affected
- API contract change → Only DTO and Controller affected
- Business rule change → Only Service affected

### 4. Scalability
- Easy to add caching at service layer
- Can switch databases by changing Repository implementation
- Can add API versioning without changing business logic

### 5. Reusability
```java
// Multiple controllers can use same service
@RestController("/api/v1/summary")
public class V1Controller {
    private final OllamaSummaryService service;
}

@RestController("/api/v2/summary")
public class V2Controller {
    private final OllamaSummaryService service; // Same service!
}
```

---

## Common Patterns and Additions

### Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
}
```

### Logging
```java
@Slf4j  // Lombok annotation
@Service
public class OllamaSummaryService {
    
    public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
        log.info("Creating summary for docId: {}", dto.getDocId());
        // ... logic
        log.debug("Successfully created: {}", result);
        return result;
    }
}
```

### Validation
```java
@Service
public class OllamaSummaryService {
    
    public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
        validateDTO(dto);
        // ... save logic
    }
    
    private void validateDTO(OllamaSummaryDTO dto) {
        if (dto.getDocId() == null) {
            throw new ValidationException("DocId required");
        }
    }
}
```

---

## Best Practices Summary

✅ **DO:**
- Keep controllers thin (just HTTP handling)
- Put business logic in services
- Use DTOs for API contracts
- Use entities only for database mapping
- Use `@Transactional` on service methods
- Return `Optional<>` from repository methods
- Use `ResponseEntity<>` for flexible responses
- Inject dependencies via constructor (Lombok `@RequiredArgsConstructor`)

❌ **DON'T:**
- Put business logic in controllers
- Expose entities directly in API
- Use repositories directly in controllers
- Return null (use Optional instead)
- Catch generic exceptions without handling
- Use field injection (`@Autowired` on fields)

---

## Conclusion

This layered architecture provides:
- **Clean separation** of concerns
- **Testable** components
- **Maintainable** codebase
- **Scalable** structure
- **Industry-standard** patterns

It's the foundation for building robust, professional Spring Boot applications.

OllamaSummary` table in PostgreSQL.I've created a complete CRUD setup for the `OllamaSummary` table with the following components:

## **1. Entity Class** - JPA entity mapping to the database table
- Uses `docId` as the primary key
- Maps `docMetadata` and `docSummary` as TEXT columns in PostgreSQL

## **2. DTO Class** - Data Transfer Object for API communication
- Clean separation between database entities and API responses

## **3. Repository Interface** - JPA Repository for database operations
- Extends `JpaRepository` for built-in CRUD methods
- Includes custom query methods for additional functionality

## **4. Service Class** - Business logic layer
- Implements all CRUD operations
- Converts between Entity and DTO
- Handles transactions

## **5. REST Controller** - API endpoints
- **POST** `/api/ollama-summary` - Create new record
- **GET** `/api/ollama-summary/{docId}` - Get by ID
- **GET** `/api/ollama-summary` - Get all records
- **PUT** `/api/ollama-summary/{docId}` - Update existing record
- **DELETE** `/api/ollama-summary/{docId}` - Delete record
- **GET** `/api/ollama-summary/{docId}/exists` - Check if record exists

**Dependencies needed in your `pom.xml`:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

# Project File Structure

```
ollama-summary-api/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           ├── Application.java                    # Main application class
│   │   │           │
│   │   │           ├── entity/
│   │   │           │   └── OllamaSummary.java             # Entity (Database table mapping)
│   │   │           │
│   │   │           ├── dto/
│   │   │           │   └── OllamaSummaryDTO.java          # Data Transfer Object
│   │   │           │
│   │   │           ├── repository/
│   │   │           │   └── OllamaSummaryRepository.java   # Repository interface
│   │   │           │
│   │   │           ├── service/
│   │   │           │   └── OllamaSummaryService.java      # Service layer (Business logic)
│   │   │           │
│   │   │           └── controller/
│   │   │               └── OllamaSummaryController.java   # REST Controller
│   │   │
│   │   └── resources/
│   │       ├── application.properties                      # Configuration file
│   │       └── application.yml                             # Alternative config (optional)
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   ├── ApplicationTests.java
│                   ├── service/
│                   │   └── OllamaSummaryServiceTest.java
│                   └── controller/
│                       └── OllamaSummaryControllerTest.java
│
├── pom.xml                                                  # Maven dependencies
├── mvnw                                                     # Maven wrapper script
├── mvnw.cmd                                                 # Maven wrapper (Windows)
└── README.md                                                # Project documentation
```

## File Descriptions

### 1. **Application.java**
- Main entry point of Spring Boot application
- Contains `@SpringBootApplication` annotation
- Starts the embedded server

### 2. **OllamaSummary.java** (Entity)
- JPA entity class
- Maps to `ollama_summary` table in PostgreSQL
- Contains database field mappings

### 3. **OllamaSummaryDTO.java** (DTO)
- Data Transfer Object
- Used for API requests/responses
- Separates API contract from database structure

### 4. **OllamaSummaryRepository.java** (Repository)
- Spring Data JPA repository interface
- Provides CRUD operations automatically
- Contains custom query methods

### 5. **OllamaSummaryService.java** (Service)
- Business logic layer
- Handles data transformation (Entity ↔ DTO)
- Manages transactions

### 6. **OllamaSummaryController.java** (Controller)
- REST API endpoints
- Handles HTTP requests/responses
- Maps URLs to service methods

### 7. **application.properties** (Configuration)
- Database connection settings
- JPA/Hibernate configuration
- Server port and logging settings

### 8. **pom.xml** (Maven)
- Project dependencies
- Build configuration
- Plugin settings

## Layer Communication Flow

```
HTTP Request
     ↓
Controller (Receives request, validates input)
     ↓
Service (Processes business logic, converts DTO ↔ Entity)
     ↓
Repository (Performs database operations)
     ↓
Database (PostgreSQL)
     ↓
Repository (Returns Entity)
     ↓
Service (Converts Entity → DTO)
     ↓
Controller (Returns HTTP Response with DTO)
     ↓
HTTP Response
```

## Package Organization

- **entity**: Database table representations
- **dto**: API data transfer objects
- **repository**: Data access layer
- **service**: Business logic layer
- **controller**: REST API endpoints

This structure follows Spring Boot best practices and promotes:
- **Separation of concerns**
- **Easy testing**
- **Maintainability**
- **Scalability**