package com.fileservice.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class FileMetadata {
    private String fileId;
    private String userId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String s3Key;
    private Instant uploadedAt;
    private Instant lastModified;
}