package com.example.service;

import com.example.dto.OllamaSummaryDTO;
import com.example.entity.OllamaSummary;
import com.example.repository.OllamaSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service layer for OllamaSummary business logic
 * Handles data transformation between Entity and DTO
 * Manages transactions and orchestrates repository operations
 */
@Service
@RequiredArgsConstructor
public class OllamaSummaryService {
    
    private final OllamaSummaryRepository repository;
    
    /**
     * Create a new OllamaSummary record
     * @param dto Data transfer object with summary details
     * @return Created OllamaSummaryDTO
     */
    @Transactional
    public OllamaSummaryDTO create(OllamaSummaryDTO dto) {
        OllamaSummary entity = toEntity(dto);
        OllamaSummary saved = repository.save(entity);
        return toDTO(saved);
    }
    
    /**
     * Get OllamaSummary by document ID
     * @param docId Document identifier
     * @return Optional containing OllamaSummaryDTO if found
     */
    public Optional<OllamaSummaryDTO> getById(String docId) {
        return repository.findById(docId)
                .map(this::toDTO);
    }
    
    /**
     * Get all OllamaSummary records
     * @return List of all OllamaSummaryDTO objects
     */
    public List<OllamaSummaryDTO> getAll() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Update an existing OllamaSummary record
     * @param docId Document identifier
     * @param dto Updated data
     * @return Optional containing updated OllamaSummaryDTO if found
     */
    @Transactional
    public Optional<OllamaSummaryDTO> update(String docId, OllamaSummaryDTO dto) {
        return repository.findById(docId)
                .map(existing -> {
                    existing.setDocMetadata(dto.getDocMetadata());
                    existing.setDocSummary(dto.getDocSummary());
                    return toDTO(repository.save(existing));
                });
    }
    
    /**
     * Delete an OllamaSummary record
     * @param docId Document identifier
     * @return true if deleted, false if not found
     */
    @Transactional
    public boolean delete(String docId) {
        if (repository.existsById(docId)) {
            repository.deleteById(docId);
            return true;
        }
        return false;
    }
    
    /**
     * Check if a document exists
     * @param docId Document identifier
     * @return true if exists, false otherwise
     */
    public boolean exists(String docId) {
        return repository.existsById(docId);
    }
    
    /**
     * Convert Entity to DTO
     * @param entity OllamaSummary entity
     * @return OllamaSummaryDTO
     */
    private OllamaSummaryDTO toDTO(OllamaSummary entity) {
        return new OllamaSummaryDTO(
                entity.getDocId(),
                entity.getDocMetadata(),
                entity.getDocSummary()
        );
    }
    
    /**
     * Convert DTO to Entity
     * @param dto OllamaSummaryDTO
     * @return OllamaSummary entity
     */
    private OllamaSummary toEntity(OllamaSummaryDTO dto) {
        return new OllamaSummary(
                dto.getDocId(),
                dto.getDocMetadata(),
                dto.getDocSummary()
        );
    }
}