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

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
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

    private String addCompletedSuffix(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "file.completed";
        }

        int lastDotIndex = fileName.lastIndexOf('.');

        if (lastDotIndex > 0) {
            // File has an extension
            String nameWithoutExt = fileName.substring(0, lastDotIndex);
            String extension = fileName.substring(lastDotIndex);
            return nameWithoutExt + ".completed" + extension;
        } else {
            // No extension
            return fileName + ".completed";
        }
    }

    @PostMapping("/summerize")
    public ResponseEntity<Map<String, Object>> summerizeFile(@RequestParam("file") MultipartFile file) {
        log.info("Received file upload request: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
        }

        try {
            long fileSize = file.getSize();
            String originalFileName = file.getOriginalFilename();
            String contentType = file.getContentType();

            // Create new filename with .completed before extension
            String newFileName = addCompletedSuffix(originalFileName);

            // Define upload directory
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);

            // Create directory if it doesn't exist
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save file with new name
            Path filePath = uploadPath.resolve(newFileName);
            file.transferTo(filePath.toFile());

            log.info("File saved as: {} with size: {} bytes", newFileName, fileSize);

            Map<String, Object> response = new HashMap<>();
            response.put("originalFileName", originalFileName);
            response.put("savedFileName", newFileName);
            response.put("filePath", filePath.toString());
            response.put("size", fileSize);
            response.put("sizeInKB", String.format("%.2f KB", fileSize / 1024.0));
            response.put("sizeInMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
            response.put("contentType", contentType);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to save file", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to save file: " + e.getMessage()));
        }
    }

    @PostMapping("/keywords")
    public ResponseEntity<Map<String, Object>> keywordsFile(@RequestParam("file") MultipartFile file) {
        log.info("Received file upload request: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
        }

        try {
            long fileSize = file.getSize();
            String originalFileName = file.getOriginalFilename();
            String contentType = file.getContentType();

            // Create new filename with .completed before extension
            String newFileName = addCompletedSuffix(originalFileName);

            // Define upload directory
            String uploadDir = "uploads/";
            Path uploadPath = Paths.get(uploadDir);

            // Create directory if it doesn't exist
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save file with new name
            Path filePath = uploadPath.resolve(newFileName);
            file.transferTo(filePath.toFile());

            log.info("File saved as: {} with size: {} bytes", newFileName, fileSize);

            Map<String, Object> response = new HashMap<>();
            response.put("originalFileName", originalFileName);
            response.put("savedFileName", newFileName);
            response.put("filePath", filePath.toString());
            response.put("size", fileSize);
            response.put("sizeInKB", String.format("%.2f KB", fileSize / 1024.0));
            response.put("sizeInMB", String.format("%.2f MB", fileSize / (1024.0 * 1024.0)));
            response.put("contentType", contentType);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Failed to save file", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to save file: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, String> health() {
        return Map.of("status", "OK");
    }
}
