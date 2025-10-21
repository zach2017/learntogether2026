package com.example.controller;

import com.example.dto.OllamaSummaryDTO;
import com.example.service.OllamaSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ollama-summary")
@RequiredArgsConstructor
public class OllamaSummaryController {
    
    private final OllamaSummaryService service;
    
    // Create
    @PostMapping
    public ResponseEntity<OllamaSummaryDTO> create(@RequestBody OllamaSummaryDTO dto) {
        OllamaSummaryDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    // Read - Get by ID
    @GetMapping("/{docId}")
    public ResponseEntity<OllamaSummaryDTO> getById(@PathVariable String docId) {
        return service.getById(docId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Read - Get all
    @GetMapping
    public ResponseEntity<List<OllamaSummaryDTO>> getAll() {
        List<OllamaSummaryDTO> summaries = service.getAll();
        return ResponseEntity.ok(summaries);
    }
    
    // Update
    @PutMapping("/{docId}")
    public ResponseEntity<OllamaSummaryDTO> update(
            @PathVariable String docId,
            @RequestBody OllamaSummaryDTO dto) {
        return service.update(docId, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Delete
    @DeleteMapping("/{docId}")
    public ResponseEntity<Void> delete(@PathVariable String docId) {
        boolean deleted = service.delete(docId);
        return deleted ? ResponseEntity.noContent().build() 
                       : ResponseEntity.notFound().build();
    }
    
    // Check existence
    @GetMapping("/{docId}/exists")
    public ResponseEntity<Boolean> exists(@PathVariable String docId) {
        return ResponseEntity.ok(service.exists(docId));
    }
}