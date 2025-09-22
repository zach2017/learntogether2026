# Complete starter example with API and frontend React

## Project Structure
```
spring-crud-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── crud/
│   │   │               ├── SpringCrudApplication.java
│   │   │               ├── controller/
│   │   │               │   └── GenericCrudController.java
│   │   │               ├── service/
│   │   │               │   ├── CrudService.java
│   │   │               │   └── CrudServiceImpl.java
│   │   │               ├── dto/
│   │   │               │   ├── CrudRequest.java
│   │   │               │   ├── CrudResponse.java
│   │   │               │   └── PersonDTO.java
│   │   │               ├── entity/
│   │   │               │   ├── BaseEntity.java
│   │   │               │   └── Person.java
│   │   │               ├── repository/
│   │   │               │   └── PersonRepository.java
│   │   │               ├── mapper/
│   │   │               │   └── EntityMapper.java
│   │   │               └── exception/
│   │   │                   ├── ResourceNotFoundException.java
│   │   │                   └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/
│   │           └── migration/
│   │               ├── V1__create_person_table.sql
│   │               └── V2__add_sample_data.sql
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── Dockerfile
├── docker-compose.yml
├── build.gradle
├── settings.gradle
├── gradlew
└── gradlew.bat
```

## 1. build.gradle
```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // PostgreSQL
    runtimeOnly 'org.postgresql:postgresql'
    
    // Flyway
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-database-postgresql'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // MapStruct
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
    annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0'
    
    // Jackson
    implementation 'com.fasterxml.jackson.datatype:jackson-datatype-jsr310'
    
    // Test dependencies
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}

// Configure annotation processing order for MapStruct and Lombok
compileJava {
    options.compilerArgs += [
        '-Amapstruct.defaultComponentModel=spring',
        '-Amapstruct.unmappedTargetPolicy=IGNORE'
    ]
}
```

## 2. settings.gradle
```gradle
rootProject.name = 'spring-crud-app'
```

## 3. gradle-wrapper.properties
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

## 4. SpringCrudApplication.java
```java
package com.example.crud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringCrudApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringCrudApplication.class, args);
    }
}
```

## 5. BaseEntity.java
```java
package com.example.crud.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
}
```

## 6. Person.java
```java
package com.example.crud.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "person")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person extends BaseEntity {
    
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @Column(name = "email", unique = true, nullable = false)
    private String email;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "city")
    private String city;
    
    @Column(name = "country")
    private String country;
    
    @Column(name = "postal_code")
    private String postalCode;
    
    @Column(name = "active")
    private Boolean active = true;
}
```

## 7. CrudRequest.java
```java
package com.example.crud.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrudRequest {
    
    @NotNull(message = "Action is required")
    @Pattern(regexp = "CREATE|READ|UPDATE|DELETE", message = "Action must be CREATE, READ, UPDATE, or DELETE")
    private String action;
    
    @JsonProperty("data")
    private JsonNode data;
    
    private String table;
    
    private Long key;
    
    private String[] columns;
    
    private Integer page;
    
    private Integer size;
    
    private String sortBy;
    
    private String sortDirection;
}
```

## 8. CrudResponse.java
```java
package com.example.crud.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CrudResponse {
    
    private boolean success;
    private String message;
    private Object data;
    private LocalDateTime timestamp;
    private String action;
    private Integer totalElements;
    private Integer totalPages;
    private Integer currentPage;
    
    public static CrudResponse success(String action, Object data, String message) {
        return CrudResponse.builder()
                .success(true)
                .action(action)
                .data(data)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static CrudResponse error(String action, String message) {
        return CrudResponse.builder()
                .success(false)
                .action(action)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

## 9. PersonDTO.java
```java
package com.example.crud.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonDTO {
    
    private Long id;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    private String phone;
    
    @Past(message = "Date of birth must be in the past")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    private String address;
    private String city;
    private String country;
    private String postalCode;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

## 10. PersonRepository.java
```java
package com.example.crud.repository;

import com.example.crud.entity.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    
    Optional<Person> findByEmail(String email);
    
    Page<Person> findByActiveTrue(Pageable pageable);
    
    @Query("SELECT p FROM Person p WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Person> searchPersons(@Param("search") String search, Pageable pageable);
}
```

## 11. EntityMapper.java
```java
package com.example.crud.mapper;

import com.example.crud.dto.PersonDTO;
import com.example.crud.entity.Person;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface EntityMapper {
    
    PersonDTO toPersonDTO(Person person);
    
    Person toPerson(PersonDTO personDTO);
    
    void updatePersonFromDTO(PersonDTO personDTO, @MappingTarget Person person);
}
```

## 12. CrudService.java
```java
package com.example.crud.service;

import com.example.crud.dto.CrudRequest;
import com.example.crud.dto.CrudResponse;

public interface CrudService {
    CrudResponse handleCrudOperation(CrudRequest request);
}
```

## 13. CrudServiceImpl.java
```java
package com.example.crud.service;

import com.example.crud.dto.CrudRequest;
import com.example.crud.dto.CrudResponse;
import com.example.crud.dto.PersonDTO;
import com.example.crud.entity.Person;
import com.example.crud.exception.ResourceNotFoundException;
import com.example.crud.mapper.EntityMapper;
import com.example.crud.repository.PersonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@EnableJpaAuditing
@Transactional
public class CrudServiceImpl implements CrudService {
    
    private final PersonRepository personRepository;
    private final EntityMapper entityMapper;
    private final ObjectMapper objectMapper;
    
    @Override
    public CrudResponse handleCrudOperation(CrudRequest request) {
        String action = request.getAction().toUpperCase();
        
        try {
            switch (action) {
                case "CREATE":
                    return handleCreate(request);
                case "READ":
                    return handleRead(request);
                case "UPDATE":
                    return handleUpdate(request);
                case "DELETE":
                    return handleDelete(request);
                default:
                    return CrudResponse.error(action, "Unsupported action: " + action);
            }
        } catch (Exception e) {
            log.error("Error processing {} operation: {}", action, e.getMessage(), e);
            return CrudResponse.error(action, "Operation failed: " + e.getMessage());
        }
    }
    
    private CrudResponse handleCreate(CrudRequest request) {
        try {
            PersonDTO personDTO = objectMapper.treeToValue(request.getData(), PersonDTO.class);
            Person person = entityMapper.toPerson(personDTO);
            Person savedPerson = personRepository.save(person);
            PersonDTO savedDTO = entityMapper.toPersonDTO(savedPerson);
            
            return CrudResponse.success("CREATE", savedDTO, "Resource created successfully");
        } catch (Exception e) {
            log.error("Create operation failed: {}", e.getMessage(), e);
            return CrudResponse.error("CREATE", "Failed to create resource: " + e.getMessage());
        }
    }
    
    private CrudResponse handleRead(CrudRequest request) {
        try {
            // If key is provided, get single entity
            if (request.getKey() != null) {
                Person person = personRepository.findById(request.getKey())
                        .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getKey()));
                PersonDTO personDTO = entityMapper.toPersonDTO(person);
                return CrudResponse.success("READ", personDTO, "Resource retrieved successfully");
            }
            
            // Otherwise, get paginated list
            int page = request.getPage() != null ? request.getPage() : 0;
            int size = request.getSize() != null ? request.getSize() : 10;
            String sortBy = request.getSortBy() != null ? request.getSortBy() : "id";
            String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "ASC";
            
            Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Person> personPage = personRepository.findAll(pageable);
            Page<PersonDTO> dtoPage = personPage.map(entityMapper::toPersonDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", dtoPage.getContent());
            response.put("totalElements", dtoPage.getTotalElements());
            response.put("totalPages", dtoPage.getTotalPages());
            response.put("currentPage", dtoPage.getNumber());
            response.put("pageSize", dtoPage.getSize());
            
            return CrudResponse.success("READ", response, "Resources retrieved successfully");
        } catch (Exception e) {
            log.error("Read operation failed: {}", e.getMessage(), e);
            return CrudResponse.error("READ", "Failed to read resource: " + e.getMessage());
        }
    }
    
    private CrudResponse handleUpdate(CrudRequest request) {
        try {
            if (request.getKey() == null) {
                return CrudResponse.error("UPDATE", "Key is required for update operation");
            }
            
            Person existingPerson = personRepository.findById(request.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getKey()));
            
            PersonDTO updateDTO = objectMapper.treeToValue(request.getData(), PersonDTO.class);
            entityMapper.updatePersonFromDTO(updateDTO, existingPerson);
            
            Person updatedPerson = personRepository.save(existingPerson);
            PersonDTO updatedDTO = entityMapper.toPersonDTO(updatedPerson);
            
            return CrudResponse.success("UPDATE", updatedDTO, "Resource updated successfully");
        } catch (Exception e) {
            log.error("Update operation failed: {}", e.getMessage(), e);
            return CrudResponse.error("UPDATE", "Failed to update resource: " + e.getMessage());
        }
    }
    
    private CrudResponse handleDelete(CrudRequest request) {
        try {
            if (request.getKey() == null) {
                return CrudResponse.error("DELETE", "Key is required for delete operation");
            }
            
            Person person = personRepository.findById(request.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getKey()));
            
            personRepository.delete(person);
            
            return CrudResponse.success("DELETE", null, "Resource deleted successfully");
        } catch (Exception e) {
            log.error("Delete operation failed: {}", e.getMessage(), e);
            return CrudResponse.error("DELETE", "Failed to delete resource: " + e.getMessage());
        }
    }
}
```

## 14. GenericCrudController.java
```java
package com.example.crud.controller;

import com.example.crud.dto.CrudRequest;
import com.example.crud.dto.CrudResponse;
import com.example.crud.service.CrudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/crud")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class GenericCrudController {
    
    private final CrudService crudService;
    
    @PostMapping
    public ResponseEntity<CrudResponse> handleCrudOperation(@Valid @RequestBody CrudRequest request) {
        log.info("Received CRUD request: action={}, table={}, key={}", 
                request.getAction(), request.getTable(), request.getKey());
        
        CrudResponse response = crudService.handleCrudOperation(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Service is healthy");
    }
}
```

## 15. ResourceNotFoundException.java
```java
package com.example.crud.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## 16. GlobalExceptionHandler.java
```java
package com.example.crud.exception;

import com.example.crud.dto.CrudResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<CrudResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        CrudResponse response = CrudResponse.error("ERROR", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CrudResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        CrudResponse response = CrudResponse.error("VALIDATION_ERROR", "Validation failed");
        response.setData(errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<CrudResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMessage());
        String message = "Data integrity violation";
        if (ex.getMessage().contains("duplicate key")) {
            message = "Duplicate entry found";
        }
        CrudResponse response = CrudResponse.error("ERROR", message);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<CrudResponse> handleGlobalException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        CrudResponse response = CrudResponse.error("ERROR", "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```

## 17. application.yml
```yaml
spring:
  application:
    name: spring-crud-app
  
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:crud_db}
    username: ${DB_USER:crud_user}
    password: ${DB_PASSWORD:crud_password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: false
  
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    schemas: public
    validate-on-migrate: true

server:
  port: ${SERVER_PORT:8080}
  error:
    include-message: always
    include-binding-errors: always

logging:
  level:
    com.example.crud: DEBUG
    org.springframework.web: INFO
    org.hibernate: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

## 18. V1__create_person_table.sql
```sql
-- Create person table
CREATE TABLE IF NOT EXISTS person (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    address VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_person_email ON person(email);
CREATE INDEX idx_person_last_name ON person(last_name);
CREATE INDEX idx_person_active ON person(active);
```

## 19. V2__add_sample_data.sql
```sql
-- Insert sample data
INSERT INTO person (first_name, last_name, email, phone, date_of_birth, address, city, country, postal_code, active)
VALUES 
    ('John', 'Doe', 'john.doe@example.com', '+1234567890', '1990-05-15', '123 Main St', 'New York', 'USA', '10001', true),
    ('Jane', 'Smith', 'jane.smith@example.com', '+1234567891', '1985-08-22', '456 Oak Ave', 'Los Angeles', 'USA', '90001', true),
    ('Robert', 'Johnson', 'robert.johnson@example.com', '+1234567892', '1978-12-10', '789 Pine Rd', 'Chicago', 'USA', '60601', true),
    ('Maria', 'Garcia', 'maria.garcia@example.com', '+1234567893', '1992-03-28', '321 Elm St', 'Houston', 'USA', '77001', true),
    ('David', 'Wilson', 'david.wilson@example.com', '+1234567894', '1988-07-07', '654 Maple Dr', 'Phoenix', 'USA', '85001', false);
```

## 20. Dockerfile
```dockerfile
# Multi-stage build for Java application
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Download dependencies
RUN gradle dependencies --no-daemon

# Copy source code
COPY src ./src

# Build application
RUN gradle build --no-daemon -x test

# Runtime stage
FROM openjdk:17-jdk-slim
WORKDIR /app

# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring

# Copy jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Change ownership
RUN chown -R spring:spring /app

USER spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/crud/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 21. docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: crud-postgres
    environment:
      POSTGRES_DB: crud_db
      POSTGRES_USER: crud_user
      POSTGRES_PASSWORD: crud_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - crud-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crud_user -d crud_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crud-app
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: crud_db
      DB_USER: crud_user
      DB_PASSWORD: crud_password
      SERVER_PORT: 8080
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - crud-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  crud-network:
    driver: bridge
```

## 22. init.sql (optional - for initial database setup)
```sql
-- This file is optional and runs when the PostgreSQL container is first created
-- Create database if not exists (handled by docker-compose environment variables)

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE crud_db TO crud_user;

-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO crud_user;
```

## 23. .dockerignore
```
# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar

# IDE
.idea/
*.iml
*.ipr
*.iws
.vscode/
*.swp
*.swo

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Documentation
README.md
*.md

# Test
src/test/
```

## 24. README.md
```markdown
# Spring Boot CRUD Application with Flyway and Docker

## Features
- Generic CRUD operations via single endpoint
- PostgreSQL database with Flyway migrations
- Docker and Docker Compose setup
- Gradle build system
- Best practices for DTOs, entities, and service layers
- Comprehensive error handling
- JPA auditing for created/updated timestamps
- Pagination and sorting support

## Prerequisites
- Java 17+
- Docker and Docker Compose
- Gradle 8.5+ (or use included wrapper)

## Quick Start

### Using Docker Compose (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd spring-crud-app

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Local Development
```bash
# Start PostgreSQL
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=crud_db \
  -e POSTGRES_USER=crud_user \
  -e POSTGRES_PASSWORD=crud_password \
  -p 5432:5432 \
  postgres:15-alpine

# Build and run application
./gradlew clean build
./gradlew bootRun
```

## API Usage Examples

### Create a Person
```bash
curl -X POST http://localhost:8080/api/crud \
  -H "Content-Type: application/json" \
  -d '{
    "action": "CREATE",
    "data": {
      "firstName": "Alice",
      "lastName": "Brown",
      "email": "alice.brown@example.com",
      "phone": "+1234567895",
      "dateOfBirth": "1995-06-15",
      "address": "789 Tech St",
      "city": "San Francisco",
      "country": "USA",
      "postalCode": "94102",
      "active": true
    }
  }'
```

### Read a Single Person
```bash
curl -X POST http://localhost:8080/api/crud \
  -H "Content-Type: application/json" \
  -d '{
    "action": "READ",
    "key": 1
  }'
```

### Read All Persons (Paginated)
```bash
curl -X POST http://localhost:8080/api/crud \
  -H "Content-Type: application/json" \
  -d '{
    "action": "READ",
    "page": 0,
    "size": 10,
    "sortBy": "lastName",
    "sortDirection": "ASC"
  }'
```

### Update a Person
```bash
curl -X POST http://localhost:8080/api/crud \
  -H "Content-Type: application/json" \
  -d '{
    "action": "UPDATE",
    "key": 1,
    "data": {
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@example.com",
      "active": true
    }
  }'
```

### Delete a Person
```bash
curl -X POST http://localhost:8080/api/crud \
  -H "Content-Type: application/json" \
  -d '{
    "action": "DELETE",
    "key": 1
  }'
```

### Health Check
```bash
curl http://localhost:8080/api/crud/health
```

## Project Structure
- **controller/** - REST controllers for handling HTTP requests
- **service/** - Business logic layer
- **dto/** - Data Transfer Objects for API communication
- **entity/** - JPA entities representing database tables
- **repository/** - Spring Data JPA repositories
- **mapper/** - MapStruct mappers for entity-DTO conversion
- **exception/** - Custom exceptions and global error handling
- **db/migration/** - Flyway database migration scripts

## Configuration

### Environment Variables
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: crud_db)
- `DB_USER` - Database username (default: crud_user)
- `DB_PASSWORD` - Database password (default: crud_password)
- `SERVER_PORT` - Application port (default: 8080)

## Extending the Application

### Adding New Entity Types
1. Create new entity class extending `BaseEntity`
2. Create corresponding DTO class
3. Create repository interface
4. Update mapper interface
5. Modify `CrudServiceImpl` to handle the new entity type
6. Create Flyway migration script

### Example: Adding a Product Entity
```java
// Product.java
@Entity
@Table(name = "product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "price", nullable = false)
    private BigDecimal price;
    
    @Column(name = "quantity")
    private Integer quantity;
    
    @Column(name = "category")
    private String category;
    
    @Column(name = "sku", unique = true)
    private String sku;
}
```

## Testing

### Run Unit Tests
```bash
./gradlew test
```

### Run Integration Tests
```bash
./gradlew integrationTest
```

## Monitoring and Logging
- Logs are configured in `application.yml`
- Application logs are at DEBUG level
- SQL queries can be enabled by setting `spring.jpa.show-sql: true`

## Security Considerations
For production deployment, consider:
1. Add Spring Security for authentication/authorization
2. Use environment-specific configuration files
3. Implement rate limiting
4. Add request/response validation
5. Use HTTPS/TLS
6. Implement API versioning
7. Add comprehensive audit logging
8. Use secrets management for credentials

## Performance Optimization
- Connection pooling is configured via HikariCP
- Database indexes are created for frequently queried columns
- JPA second-level cache can be enabled for better performance
- Consider implementing response caching for read operations

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs crud-postgres

# Test database connection
psql -h localhost -U crud_user -d crud_db
```

### Application Not Starting
```bash
# Check application logs
docker logs crud-app

# Verify port availability
netstat -an | grep 8080

# Check Flyway migrations
./gradlew flywayInfo
```

## License
MIT License

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
```