package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.data.OllamaGenerateResponse;
import com.example.demo.service.OllamaService;

import com.example.demo.data.OllamaGenerateResponse;
import com.example.demo.data.OllamaGenerateRequest;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/files")
@CrossOrigin(origins = "*")
@Tag(name = "File Type Detection", description = "API for detecting file types by extension")
public class FileTypeController {

    @PostMapping(value = "/detect-type", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Detect file type", description = "Upload a file (PDF or image) and get its type based on extension")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "File type detected successfully", content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Invalid file or unsupported file type"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<String> detectFileType(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String prompt = "Summeraize this file";
        String model = "tinyllama";

        try {
            OllamaGenerateResponse response = OllamaService.getInstance().generate(model, prompt, file);
            // return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("ignore"); // TBD;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            return ResponseEntity.badRequest().body("Invalid file name");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

        String fileType = determineFileType(extension);

        if (fileType.equals("Unsupported file type")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(fileType);
        }

        return ResponseEntity.ok("File type: " + fileType);

    }

    private String determineFileType(String extension) {
        switch (extension) {
            case "pdf":
                return "PDF Document";
            case "jpg":
            case "jpeg":
                return "JPEG Image";
            case "png":
                return "PNG Image";
            case "gif":
                return "GIF Image";
            case "bmp":
                return "BMP Image";
            case "webp":
                return "WebP Image";
            case "svg":
                return "SVG Image";
            case "tiff":
            case "tif":
                return "TIFF Image";
            default:
                return "Unsupported file type";
        }
    }
}