package com.example.demo.data;


import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

/**
 * Represents the JSON response from the Ollama /api/generate endpoint when stream=false.
 */
public record OllamaGenerateResponse(
    String model,
    @JsonProperty("created_at")
    OffsetDateTime createdAt,
    String response,
    boolean done
    // You can add other fields like "total_duration", "context", etc. if needed.
) {}