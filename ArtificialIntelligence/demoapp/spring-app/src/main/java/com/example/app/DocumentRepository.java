package com.example.app;

import com.example.documentupload.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByS3Key(String s3Key);
}
