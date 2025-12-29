package com.example.sqsdemo;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for messages sent to and received from SQS
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    /**
     * Unique identifier for the message
     */
    @JsonProperty("id")
    private String id;

    /**
     * The actual message content
     */
    @JsonProperty("content")
    @NotBlank(message = "Content cannot be blank")
    private String content;

    /**
     * Message type/category
     */
    @JsonProperty("type")
    @NotNull(message = "Type cannot be null")
    private String type;

    /**
     * Priority level (e.g., HIGH, MEDIUM, LOW)
     */
    @JsonProperty("priority")
    private String priority;

    /**
     * Timestamp when the message was created
     */
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    /**
     * Optional metadata as a nested object
     */
    @JsonProperty("metadata")
    private Metadata metadata;

    /**
     * Nested class for additional metadata
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metadata {
        @JsonProperty("source")
        private String source;

        @JsonProperty("userId")
        private String userId;

        @JsonProperty("tags")
        private String[] tags;
    }
}
