public package com.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity class representing the ollama_summary table in PostgreSQL
 * Maps Java object to database table structure
 */
@Entity
@Table(name = "ollama_summary")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OllamaSummary {
    
    @Id
    @Column(name = "doc_id", nullable = false, length = 255)
    private String docId;
    
    @Column(name = "doc_metadata", columnDefinition = "TEXT")
    private String docMetadata;
    
    @Column(name = "doc_summary", columnDefinition = "TEXT")
    private String docSummary;
} {
    
}
