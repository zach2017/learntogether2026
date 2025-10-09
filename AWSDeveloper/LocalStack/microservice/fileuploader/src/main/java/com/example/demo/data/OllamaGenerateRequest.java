package com.example.demo.data;


import java.util.List;

/**
 * Represents the JSON request body to send to the Ollama /api/generate endpoint.
 *
 * @param model The name of the model to use (e.g., "llava").
 * @param prompt The text prompt.
 * @param images A list of Base64-encoded image strings.
 * @param stream Whether to stream the response (false for a single response).
 */
public record OllamaGenerateRequest(
    String model,
    String prompt,
    List<String> images,
    boolean stream
) {}