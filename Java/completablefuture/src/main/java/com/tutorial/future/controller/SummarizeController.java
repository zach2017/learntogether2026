package com.tutorial.future.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

import com.tutorial.future.service.SummarizeService;
@RestController
@RequestMapping("/api")
public class SummarizeController {

    private final SummarizeService summarizeService;
    private final ConcurrentHashMap<String, CompletableFuture<String>> taskMap = new ConcurrentHashMap<>();

    @Autowired
    public SummarizeController(SummarizeService summarizeService) {
        this.summarizeService = summarizeService;
    }

    @GetMapping("/summarize")
    public ResponseEntity<?> summarize(@RequestParam(required = false) String text) {
        // Catch error if text is not passed
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Error: Text parameter is required"));
        }

        // Generate unique task ID
        String taskId = UUID.randomUUID().toString();

        // Start async task and store it
        CompletableFuture<String> future = summarizeService.summarize(text);
        taskMap.put(taskId, future);

        // Return task started response with ID
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new TaskStartedResponse("Task started successfully", taskId));
    }

    @GetMapping("/summarize-result/{taskId}")
    public ResponseEntity<?> getSummarizeResult(@PathVariable String taskId) {
        CompletableFuture<String> future = taskMap.get(taskId);

        // Check if task exists
        if (future == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Task not found with ID: " + taskId));
        }

        // Check if task is completed
        if (!future.isDone()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(new TaskStatusResponse("Task is still processing", taskId, false));
        }

        try {
            String result = future.get();
            taskMap.remove(taskId); // Clean up completed task
            return ResponseEntity.ok(new TaskResultResponse("Task completed", taskId, result, true));
        } catch (Exception e) {
            taskMap.remove(taskId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error retrieving result: " + e.getMessage()));
        }
    }

    @PostMapping("/summarize-url")
    public ResponseEntity<?> summarizeFromUrl(@RequestParam(required = false) String url) {
        if (url == null || url.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Error: URL parameter is required"));
        }

        String taskId = UUID.randomUUID().toString();
        CompletableFuture<String> future = summarizeService.summarizeFromUrl(url);
        taskMap.put(taskId, future);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new TaskStartedResponse("Task started successfully", taskId));
    }

    @PostMapping("/summarize-multiple")
    public ResponseEntity<?> summarizeMultiple(
            @RequestParam(required = false) String text1,
            @RequestParam(required = false) String text2) {
        
        if ((text1 == null || text1.trim().isEmpty()) || 
            (text2 == null || text2.trim().isEmpty())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Error: Both text1 and text2 parameters are required"));
        }

        String taskId = UUID.randomUUID().toString();
        CompletableFuture<String> future = summarizeService.summarizeMultiple(text1, text2);
        taskMap.put(taskId, future);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new TaskStartedResponse("Task started successfully", taskId));
    }

    // Response DTOs
    static class TaskStartedResponse {
        public String message;
        public String taskId;
        public String status;

        public TaskStartedResponse(String message, String taskId) {
            this.message = message;
            this.taskId = taskId;
            this.status = "PROCESSING";
        }
    }

    static class TaskStatusResponse {
        public String message;
        public String taskId;
        public boolean completed;
        public String status;

        public TaskStatusResponse(String message, String taskId, boolean completed) {
            this.message = message;
            this.taskId = taskId;
            this.completed = completed;
            this.status = "PENDING";
        }
    }

    static class TaskResultResponse {
        public String message;
        public String taskId;
        public String result;
        public boolean completed;
        public String status;

        public TaskResultResponse(String message, String taskId, String result, boolean completed) {
            this.message = message;
            this.taskId = taskId;
            this.result = result;
            this.completed = completed;
            this.status = "COMPLETED";
        }
    }

    static class ErrorResponse {
        public String error;
        public String timestamp;

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = java.time.LocalDateTime.now().toString();
        }
    }

    // Global error handler for all exceptions
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid argument: " + e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error: " + e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("An unexpected error occurred: " + e.getMessage()));
    }
}