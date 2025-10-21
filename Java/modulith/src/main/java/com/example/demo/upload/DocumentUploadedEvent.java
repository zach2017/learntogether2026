package com.example.demo.upload;

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


