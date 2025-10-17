package com.example.repository;

import com.example.entity.OllamaSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for OllamaSummary entity
 * Provides CRUD operations and custom query methods
 * Spring Data JPA automatically generates implementation
 */
@Repository
public interface OllamaSummaryRepository extends JpaRepository<OllamaSummary, String> {
    
    // Custom query methods - Spring generates SQL from method names
    Optional<OllamaSummary> findByDocId(String docId);
    
    List<OllamaSummary> findByDocMetadataContaining(String keyword);
    
    boolean existsByDocId(String docId);
    
    void deleteByDocId(String docId);
}