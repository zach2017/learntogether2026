package com.example.app;

import com.example.documentupload.dto.DocumentUploadRequest;
import com.example.documentupload.model.Document;
import com.example.documentupload.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final S3Service s3Service;
    private final SqsService sqsService;

    public DocumentService(DocumentRepository documentRepository, S3Service s3Service, SqsService sqsService) {
        this.documentRepository = documentRepository;
        this.s3Service = s3Service;
        this.sqsService = sqsService;
    }

    public Document uploadDocument(MultipartFile file, DocumentUploadRequest request) throws IOException {
        String s3Key = UUID.randomUUID() + "/" + file.getOriginalFilename();
        
        // Upload to S3
        s3Service.uploadFile(s3Key, file.getInputStream(), file.getSize(), file.getContentType());

        // Save metadata to database
        Document document = Document.builder()
                .fileName(file.getOriginalFilename())
                .s3Key(s3Key)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .title(request.getTitle())
                .description(request.getDescription())
                .author(request.getAuthor())
                .build();

        Document savedDocument = documentRepository.save(document);

        // Send message to SQS queue
        sqsService.sendMessage(savedDocument.getId().toString(), s3Key, file.getOriginalFilename());

        return savedDocument;
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public Document updateSummary(String s3Key, String summary) {
        Document document = documentRepository.findByS3Key(s3Key)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setSummary(summary);
        return documentRepository.save(document);
    }
}
