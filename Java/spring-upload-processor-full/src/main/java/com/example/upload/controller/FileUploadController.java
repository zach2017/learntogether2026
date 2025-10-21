package com.example.upload.controller;

import com.example.upload.dto.ProcessResult;
import com.example.upload.service.ExternalProcessingService;
import com.example.upload.service.FileStorageService;
import jakarta.validation.constraints.NotEmpty;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Validated
@CrossOrigin // remove or restrict as needed
@Slf4j
public class FileUploadController {

    private final FileStorageService storage;
    private final ExternalProcessingService external;

    public FileUploadController(FileStorageService storage, ExternalProcessingService external) {
        this.storage = storage;
        this.external = external;
    }

    @PostMapping(
        value = "/upload",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Map<String, Object> upload(@RequestPart("files") @NotEmpty MultipartFile[] files) throws Exception {
        List<ProcessResult> results = new ArrayList<>();

        for (MultipartFile f : files) {
            if (f == null || f.isEmpty()) {
                // skip empties; alternatively, throw an error
                continue;
            }

            Path saved = storage.save(f);

            // Sequential processing per file
            Map<String, Object> sRes = external.callSummerize(saved);
            Map<String, Object> kRes = external.callKeywords(saved);

            results.add(new ProcessResult(saved.getFileName().toString(), sRes, kRes));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("count", results.size());
        response.put("results", results);
        return response;
    }

    @PostMapping("/summerize")
    public ResponseEntity<Map<String, Object>> summerizeFile(@RequestParam("file") MultipartFile file) {
        log.info("Received file upload request: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
        }
        
        long fileSize = file.getSize();
        String fileName = file.getOriginalFilename();
        String contentType = file.getContentType();
        
        log.info("File size: {} bytes", fileSize);
        
        Map<String, Object> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("size", fileSize);
        response.put("sizeInKB", String.format("%.2f KB", fileSize / 1024.0));
        response.put("sizeInMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
        response.put("contentType", contentType);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/keywords")
    public ResponseEntity<Map<String, Object>> keywordsFile(@RequestParam("file") MultipartFile file) {
        log.info("Received file upload request: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
        }
        
        long fileSize = file.getSize();
        String fileName = file.getOriginalFilename();
        String contentType = file.getContentType();
        
        log.info("File size: {} bytes", fileSize);
        
        Map<String, Object> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("size", fileSize);
        response.put("sizeInKB", String.format("%.2f KB", fileSize / 1024.0));
        response.put("sizeInMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
        response.put("contentType", contentType);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> health() {
        return Map.of("status", "OK");
    }
}
