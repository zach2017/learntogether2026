package com.fileservice.controller;

import com.fileservice.dto.FileMetadata;
import com.fileservice.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {
    
    @Autowired
    private FileService fileService;
    
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'UPLOAD')")
    public ResponseEntity<FileMetadata> uploadFile(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            FileMetadata metadata = fileService.uploadFile(file, userId);
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{fileId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VIEW', 'DOWNLOAD')")
    public ResponseEntity<FileMetadata> getFileMetadata(
            @PathVariable String fileId,
            Authentication authentication) {
        try {
            FileMetadata metadata = fileService.getFileMetadata(fileId);
            
            // View role gets error if trying to actually download
            if (authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_VIEW") && 
                                   !a.getAuthority().equals("ROLE_ADMIN") &&
                                   !a.getAuthority().equals("ROLE_DOWNLOAD"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .header("X-Error-Message", "View-only access: download not permitted")
                        .body(metadata);
            }
            
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{fileId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOWNLOAD')")
    public ResponseEntity<ByteArrayResource> downloadFile(@PathVariable String fileId) {
        try {
            byte[] data = fileService.downloadFile(fileId);
            FileMetadata metadata = fileService.getFileMetadata(fileId);
            
            ByteArrayResource resource = new ByteArrayResource(data);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + metadata.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(metadata.getContentType()))
                    .contentLength(data.length)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/list")
    @PreAuthorize("hasAnyRole('ADMIN', 'VIEW', 'UPLOAD', 'DOWNLOAD', 'GUEST')")
    public ResponseEntity<List<FileMetadata>> listFiles(Authentication authentication) {
        String userId = authentication.getName();
        List<FileMetadata> files = fileService.listUserFiles(userId);
        return ResponseEntity.ok(files);
    }
    
    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileId) {
        try {
            fileService.deleteFile(fileId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

// src/main/java/com/fileservice/service/FileService.java
package com.fileservice.service;

import com.fileservice.dto.FileMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FileService {
    
    @Autowired
    private S3Client s3Client;
    
    @Autowired
    private DynamoDbClient dynamoDbClient;
    
    @Value("${s3.bucket.name}")
    private String bucketName;
    
    @Value("${dynamodb.table.name}")
    private String tableName;
    
    public FileMetadata uploadFile(MultipartFile file, String userId) throws Exception {
        String fileId = UUID.randomUUID().toString();
        String s3Key = userId + "/" + fileId + "/" + file.getOriginalFilename();
        
        // Upload to S3
        s3Client.putObject(PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(file.getContentType())
                .build(),
                RequestBody.fromBytes(file.getBytes()));
        
        // Save metadata to DynamoDB
        FileMetadata metadata = new FileMetadata();
        metadata.setFileId(fileId);
        metadata.setUserId(userId);
        metadata.setFileName(file.getOriginalFilename());
        metadata.setContentType(file.getContentType());
        metadata.setFileSize(file.getSize());
        metadata.setS3Key(s3Key);
        metadata.setUploadedAt(Instant.now());
        metadata.setLastModified(Instant.now());
        
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("fileId", AttributeValue.builder().s(fileId).build());
        item.put("userId", AttributeValue.builder().s(userId).build());
        item.put("fileName", AttributeValue.builder().s(file.getOriginalFilename()).build());
        item.put("contentType", AttributeValue.builder().s(file.getContentType()).build());
        item.put("fileSize", AttributeValue.builder().n(String.valueOf(file.getSize())).build());
        item.put("s3Key", AttributeValue.builder().s(s3Key).build());
        item.put("uploadedAt", AttributeValue.builder().s(Instant.now().toString()).build());
        
        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build());
        
        return metadata;
    }
    
    public FileMetadata getFileMetadata(String fileId) {
        GetItemResponse response = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("fileId", AttributeValue.builder().s(fileId).build()))
                .build());
        
        if (!response.hasItem()) {
            throw new RuntimeException("File not found");
        }
        
        Map<String, AttributeValue> item = response.item();
        FileMetadata metadata = new FileMetadata();
        metadata.setFileId(item.get("fileId").s());
        metadata.setUserId(item.get("userId").s());
        metadata.setFileName(item.get("fileName").s());
        metadata.setContentType(item.get("contentType").s());
        metadata.setFileSize(Long.parseLong(item.get("fileSize").n()));
        metadata.setS3Key(item.get("s3Key").s());
        metadata.setUploadedAt(Instant.parse(item.get("uploadedAt").s()));
        
        return metadata;
    }
    
    public byte[] downloadFile(String fileId) throws Exception {
        FileMetadata metadata = getFileMetadata(fileId);
        
        return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucketName)
                .key(metadata.getS3Key())
                .build()).asByteArray();
    }
    
    public List<FileMetadata> listUserFiles(String userId) {
        QueryResponse response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .indexName("UserIdIndex")
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                        ":userId", AttributeValue.builder().s(userId).build()))
                .build());
        
        return response.items().stream()
                .map(item -> {
                    FileMetadata metadata = new FileMetadata();
                    metadata.setFileId(item.get("fileId").s());
                    metadata.setUserId(item.get("userId").s());
                    metadata.setFileName(item.get("fileName").s());
                    metadata.setContentType(item.get("contentType").s());
                    metadata.setFileSize(Long.parseLong(item.get("fileSize").n()));
                    metadata.setS3Key(item.get("s3Key").s());
                    metadata.setUploadedAt(Instant.parse(item.get("uploadedAt").s()));
                    return metadata;
                })
                .collect(Collectors.toList());
    }
    
    public void deleteFile(String fileId) {
        FileMetadata metadata = getFileMetadata(fileId);
        
        // Delete from S3
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(metadata.getS3Key())
                .build());
        
        // Delete from DynamoDB
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(tableName)
                .key(Map.of("fileId", AttributeValue.builder().s(fileId).build()))
                .build());
    }
}