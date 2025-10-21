// pom.xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>document-processor</artifactId>
    <version>1.0.0</version>
    <name>Document Processor</name>
    
    <properties>
        <java.version>17</java.version>
        <spring-modulith.version>1.1.0</spring-modulith.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Modulith -->
        <dependency>
            <groupId>org.springframework.modulith</groupId>
            <artifactId>spring-modulith-starter-core</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.modulith</groupId>
            <artifactId>spring-modulith-events-api</artifactId>
        </dependency>
        
        <!-- AWS S3 -->
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
            <version>2.20.0</version>
        </dependency>
        
        <!-- Azure Storage -->
        <dependency>
            <groupId>com.azure</groupId>
            <artifactId>azure-storage-blob</artifactId>
            <version>12.23.0</version>
        </dependency>
        
        <!-- Google Cloud Storage -->
        <dependency>
            <groupId>com.google.cloud</groupId>
            <artifactId>google-cloud-storage</artifactId>
            <version>2.29.0</version>
        </dependency>
        
        <!-- WebClient for Ollama -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.modulith</groupId>
                <artifactId>spring-modulith-bom</artifactId>
                <version>${spring-modulith.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>

// ============================================
// Main Application
// ============================================
package com.example.documentprocessor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulith;

@Modulith
@SpringBootApplication
public class DocumentProcessorApplication {
    public static void main(String[] args) {
        SpringApplication.run(DocumentProcessorApplication.class, args);
    }
}

// ============================================
// UPLOAD MODULE
// ============================================
package com.example.documentprocessor.upload;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentUploadedEvent {
    private String documentId;
    private String fileName;
    private String storageLocation;
    private String contentType;
    private long fileSize;
    private LocalDateTime uploadedAt;
}

// ============================================
package com.example.documentprocessor.upload;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StorageService {
    String store(MultipartFile file) throws IOException;
    byte[] retrieve(String location) throws IOException;
    void delete(String location) throws IOException;
}

// ============================================
package com.example.documentprocessor.upload.storage;

import com.example.documentprocessor.upload.StorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "filesystem", matchIfMissing = true)
public class FileSystemStorageService implements StorageService {
    
    private final Path rootLocation = Paths.get("upload-dir");
    
    public FileSystemStorageService() throws IOException {
        Files.createDirectories(rootLocation);
    }
    
    @Override
    public String store(MultipartFile file) throws IOException {
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path destinationFile = rootLocation.resolve(filename);
        
        Files.copy(file.getInputStream(), destinationFile, 
                   StandardCopyOption.REPLACE_EXISTING);
        
        return filename;
    }
    
    @Override
    public byte[] retrieve(String location) throws IOException {
        return Files.readAllBytes(rootLocation.resolve(location));
    }
    
    @Override
    public void delete(String location) throws IOException {
        Files.deleteIfExists(rootLocation.resolve(location));
    }
}

// ============================================
package com.example.documentprocessor.upload.storage;

import com.example.documentprocessor.upload.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {
    
    private final S3Client s3Client;
    private final String bucketName;
    
    public S3StorageService(
            @Value("${aws.s3.bucket}") String bucketName,
            @Value("${aws.access-key}") String accessKey,
            @Value("${aws.secret-key}") String secretKey,
            @Value("${aws.region}") String region) {
        
        this.bucketName = bucketName;
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
    
    @Override
    public String store(MultipartFile file) throws IOException {
        String key = UUID.randomUUID() + "_" + file.getOriginalFilename();
        
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();
        
        s3Client.putObject(putObjectRequest, 
                          RequestBody.fromBytes(file.getBytes()));
        
        return key;
    }
    
    @Override
    public byte[] retrieve(String location) throws IOException {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(location)
                .build();
        
        return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
    }
    
    @Override
    public void delete(String location) throws IOException {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(location)
                .build();
        
        s3Client.deleteObject(deleteObjectRequest);
    }
}

// ============================================
package com.example.documentprocessor.upload.storage;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.example.documentprocessor.upload.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "azure")
public class AzureStorageService implements StorageService {
    
    private final BlobContainerClient containerClient;
    
    public AzureStorageService(
            @Value("${azure.storage.connection-string}") String connectionString,
            @Value("${azure.storage.container}") String containerName) {
        
        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
        
        this.containerClient = blobServiceClient
                .getBlobContainerClient(containerName);
    }
    
    @Override
    public String store(MultipartFile file) throws IOException {
        String blobName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        blobClient.upload(file.getInputStream(), file.getSize(), true);
        
        return blobName;
    }
    
    @Override
    public byte[] retrieve(String location) throws IOException {
        BlobClient blobClient = containerClient.getBlobClient(location);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);
        return outputStream.toByteArray();
    }
    
    @Override
    public void delete(String location) throws IOException {
        BlobClient blobClient = containerClient.getBlobClient(location);
        blobClient.delete();
    }
}

// ============================================
package com.example.documentprocessor.upload.storage;

import com.example.documentprocessor.upload.StorageService;
import com.google.cloud.storage.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "gcs")
public class GoogleCloudStorageService implements StorageService {
    
    private final Storage storage;
    private final String bucketName;
    
    public GoogleCloudStorageService(
            @Value("${gcs.bucket}") String bucketName,
            @Value("${gcs.project-id}") String projectId) {
        
        this.bucketName = bucketName;
        this.storage = StorageOptions.newBuilder()
                .setProjectId(projectId)
                .build()
                .getService();
    }
    
    @Override
    public String store(MultipartFile file) throws IOException {
        String blobName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        
        BlobId blobId = BlobId.of(bucketName, blobName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();
        
        storage.create(blobInfo, file.getBytes());
        
        return blobName;
    }
    
    @Override
    public byte[] retrieve(String location) throws IOException {
        BlobId blobId = BlobId.of(bucketName, location);
        return storage.readAllBytes(blobId);
    }
    
    @Override
    public void delete(String location) throws IOException {
        BlobId blobId = BlobId.of(bucketName, location);
        storage.delete(blobId);
    }
}

// ============================================
package com.example.documentprocessor.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadService {
    
    private final StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;
    
    public String uploadDocument(MultipartFile file) throws IOException {
        String documentId = UUID.randomUUID().toString();
        String storageLocation = storageService.store(file);
        
        DocumentUploadedEvent event = new DocumentUploadedEvent(
                documentId,
                file.getOriginalFilename(),
                storageLocation,
                file.getContentType(),
                file.getSize(),
                LocalDateTime.now()
        );
        
        eventPublisher.publishEvent(event);
        
        return documentId;
    }
}

// ============================================
package com.example.documentprocessor.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {
    
    private final UploadService uploadService;
    
    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file) {
        try {
            String documentId = uploadService.uploadDocument(file);
            return ResponseEntity.ok(Map.of(
                    "documentId", documentId,
                    "message", "File uploaded successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

// ============================================
// SUMMARIZATION MODULE
// ============================================
package com.example.documentprocessor.summarization;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentSummary {
    private String documentId;
    private String summary;
    private Map<String, Object> metadata;
}

// ============================================
package com.example.documentprocessor.summarization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaService {
    
    private final WebClient.Builder webClientBuilder;
    
    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;
    
    @Value("${ollama.model:llama2}")
    private String model;
    
    public String generateSummary(String content) {
        WebClient webClient = webClientBuilder
                .baseUrl(ollamaBaseUrl)
                .build();
        
        String prompt = "Summarize the following document in 3-5 sentences:\n\n" + content;
        
        Map<String, Object> request = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false
        );
        
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/api/generate")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            return response != null ? (String) response.get("response") : "No summary generated";
        } catch (Exception e) {
            log.error("Error calling Ollama: ", e);
            return "Error generating summary: " + e.getMessage();
        }
    }
    
    public Map<String, Object> extractMetadata(String content) {
        WebClient webClient = webClientBuilder
                .baseUrl(ollamaBaseUrl)
                .build();
        
        String prompt = "Extract key metadata from this document (title, author, date, topics). " +
                "Return as JSON format:\n\n" + content;
        
        Map<String, Object> request = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false,
                "format", "json"
        );
        
        try {
            Map<String, Object> response = webClient.post()
                    .uri("/api/generate")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            return response != null ? Map.of("metadata", response.get("response")) : Map.of();
        } catch (Exception e) {
            log.error("Error extracting metadata: ", e);
            return Map.of("error", e.getMessage());
        }
    }
}

// ============================================
package com.example.documentprocessor.summarization;

import com.example.documentprocessor.upload.DocumentUploadedEvent;
import com.example.documentprocessor.upload.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummarizationService {
    
    private final OllamaService ollamaService;
    private final StorageService storageService;
    
    @EventListener
    public void handleDocumentUploaded(DocumentUploadedEvent event) {
        log.info("Processing document for summarization: {}", event.getDocumentId());
        
        try {
            byte[] content = storageService.retrieve(event.getStorageLocation());
            String textContent = new String(content);
            
            String summary = ollamaService.generateSummary(textContent);
            Map<String, Object> metadata = ollamaService.extractMetadata(textContent);
            
            DocumentSummary documentSummary = new DocumentSummary(
                    event.getDocumentId(),
                    summary,
                    metadata
            );
            
            log.info("Summary generated for document: {}", event.getDocumentId());
        } catch (Exception e) {
            log.error("Error summarizing document: ", e);
        }
    }
}

// ============================================
// LOCATION MAPPING MODULE
// ============================================
package com.example.documentprocessor.locationmapping;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeoPoint {
    private String location;
    private double latitude;
    private double longitude;
}

// ============================================
package com.example.documentprocessor.locationmapping;

import com.example.documentprocessor.upload.DocumentUploadedEvent;
import com.example.documentprocessor.upload.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationMappingService {
    
    private final StorageService storageService;
    
    @EventListener
    public void handleDocumentUploaded(DocumentUploadedEvent event) {
        log.info("Extracting locations from document: {}", event.getDocumentId());
        
        try {
            byte[] content = storageService.retrieve(event.getStorageLocation());
            String textContent = new String(content);
            
            List<GeoPoint> locations = extractLocations(textContent);
            
            log.info("Found {} locations in document: {}", 
                    locations.size(), event.getDocumentId());
            
            locations.forEach(loc -> 
                log.info("Location: {} at ({}, {})", 
                        loc.getLocation(), loc.getLatitude(), loc.getLongitude()));
            
        } catch (Exception e) {
            log.error("Error mapping locations: ", e);
        }
    }
    
    private List<GeoPoint> extractLocations(String content) {
        List<GeoPoint> geoPoints = new ArrayList<>();
        
        // Simple pattern matching for common city names
        Pattern pattern = Pattern.compile(
                "\\b(New York|London|Paris|Tokyo|Sydney|Berlin|Rome|Madrid)\\b", 
                Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = pattern.matcher(content);
        
        while (matcher.find()) {
            String location = matcher.group();
            GeoPoint geoPoint = getCoordinates(location);
            if (geoPoint != null) {
                geoPoints.add(geoPoint);
            }
        }
        
        return geoPoints;
    }
    
    private GeoPoint getCoordinates(String location) {
        // Simplified mapping - in production, use a geocoding API
        Map<String, double[]> coordinates = Map.of(
                "New York", new double[]{40.7128, -74.0060},
                "London", new double[]{51.5074, -0.1278},
                "Paris", new double[]{48.8566, 2.3522},
                "Tokyo", new double[]{35.6762, 139.6503},
                "Sydney", new double[]{-33.8688, 151.2093},
                "Berlin", new double[]{52.5200, 13.4050},
                "Rome", new double[]{41.9028, 12.4964},
                "Madrid", new double[]{40.4168, -3.7038}
        );
        
        String normalizedLocation = location.substring(0, 1).toUpperCase() + 
                                   location.substring(1).toLowerCase();
        
        double[] coords = coordinates.get(normalizedLocation);
        
        return coords != null ? 
                new GeoPoint(normalizedLocation, coords[0], coords[1]) : null;
    }
}

// ============================================
// APPLICATION CONFIGURATION
// ============================================
// src/main/resources/application.yml
/*
server:
  port: 8080

spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
  modulith:
    events:
      republish-outstanding-events-on-restart: true

# Storage Configuration (choose one)
storage:
  type: filesystem  # Options: filesystem, s3, azure, gcs

# AWS S3 Configuration (if using S3)
aws:
  access-key: ${AWS_ACCESS_KEY}
  secret-key: ${AWS_SECRET_KEY}
  region: us-east-1
  s3:
    bucket: my-document-bucket

# Azure Storage Configuration (if using Azure)
azure:
  storage:
    connection-string: ${AZURE_STORAGE_CONNECTION_STRING}
    container: documents

# Google Cloud Storage Configuration (if using GCS)
gcs:
  project-id: ${GCP_PROJECT_ID}
  bucket: my-document-bucket

# Ollama Configuration
ollama:
  base-url: http://localhost:11434
  model: llama2

logging:
  level:
    com.example.documentprocessor: DEBUG
*/