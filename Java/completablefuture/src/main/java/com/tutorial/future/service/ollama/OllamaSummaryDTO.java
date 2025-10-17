package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for OllamaSummary
 * Used for transferring data between API layers
 * Separates API contract from database entity structure
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OllamaSummaryDTO {
    
    private String docId;
    private String docMetadata;
    private String docSummary;
}