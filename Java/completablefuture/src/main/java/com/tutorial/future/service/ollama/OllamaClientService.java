package com.tutorial.future.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * Simple Ollama client service for sending text prompts to a local Ollama server.
 * Uses WebClient for async/non-blocking calls.
 */
@Service
@Slf4j
public class OllamaClientService {

    private final WebClient webClient;
    private final String defaultModel;

    public OllamaClientService(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:tinyllama}") String defaultModel) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.defaultModel = defaultModel;
    }

    /**
     * Send a text prompt to Ollama and return the generated text (non-streaming).
     *curl http://localhost:11434/api/generate -d "{ \"model\": \"qwen3:1.7b\", \"prompt\": \"Why is the sky blue?\", \"stream\": false }"

     * @param prompt The input prompt text
     * @return The generated response text
     */
    public String sendPrompt(String prompt) {
        Map<String, Object> body = Map.of(
                "model", defaultModel,
                "prompt", prompt,
                "stream", false
        );

        log.info(body.toString());
        return webClient.post()
                .uri("/api/generate")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(resp -> (String) resp.get("response"))
                .onErrorResume(e -> {
                    e.printStackTrace();
                    return Mono.just("Error: " + e.getMessage());
                })
                .block(); // block since it's a simple sync call
    }
}
