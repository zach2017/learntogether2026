package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

/**
 * Data Transfer Object for OllamaSummary
 * Used for transferring data between API layers
 * Separates API contract from database entity structure
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OllamaSummaryDTO {
    
    private String docId;
    private String docMetadata;
    private String docSummary;
}