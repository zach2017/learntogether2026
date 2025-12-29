package com.example.sqsdemo;

import com.example.sqsdemo.MessageDTO;
import com.example.sqsdemo.SqsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/sqs")
@RequiredArgsConstructor
public class SqsController {

    private final SqsService sqsService;

    /**
     * Publishes a message to the SQS queue
     * 
     * POST /api/sqs/publish
     * 
     * Request Body Example:
     * {
     *   "content": "Hello from Spring Boot",
     *   "type": "NOTIFICATION",
     *   "priority": "HIGH",
     *   "metadata": {
     *     "source": "web-app",
     *     "userId": "user123",
     *     "tags": ["important", "urgent"]
     *   }
     * }
     *
     * @param messageDTO the message to publish
     * @return response with message ID and status
     */
    @PostMapping("/publish")
    public ResponseEntity<Map<String, Object>> publishMessage(@Valid @RequestBody MessageDTO messageDTO) {
        log.info("Received request to publish message: {}", messageDTO);
        
        try {
            String messageId = sqsService.publishMessage(messageDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messageId", messageId);
            response.put("message", "Message published successfully");
            response.put("queueMessageCount", sqsService.getApproximateMessageCount());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("Error publishing message", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Reads the next message from the SQS queue
     * 
     * GET /api/sqs/read
     * 
     * Returns the next message if available, or an empty response if no messages
     *
     * @return the message or empty response
     */
    @GetMapping("/read")
    public ResponseEntity<Map<String, Object>> readMessage() {
        log.info("Received request to read message from queue");
        
        try {
            Optional<MessageDTO> messageOpt = sqsService.readMessage();
            
            Map<String, Object> response = new HashMap<>();
            
            if (messageOpt.isPresent()) {
                response.put("success", true);
                response.put("message", messageOpt.get());
                response.put("hasMessage", true);
                response.put("remainingMessages", sqsService.getApproximateMessageCount());
                
                log.info("Message retrieved successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", true);
                response.put("message", null);
                response.put("hasMessage", false);
                response.put("info", "No messages available in the queue");
                
                log.info("No messages available in queue");
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            log.error("Error reading message", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Health check endpoint
     * 
     * GET /api/sqs/health
     *
     * @return health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "SQS Integration Service");
        health.put("queueMessageCount", sqsService.getApproximateMessageCount());
        
        return ResponseEntity.ok(health);
    }
}
