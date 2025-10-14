package org.acme;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ollama")
public class OllamaController {

    private static final String OLLAMA_URL = "http://localhost:11439/api/generate";
    private final RestTemplate restTemplate;

    public OllamaController() {
        this.restTemplate = new RestTemplate();
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateResponse(@RequestBody PromptRequest request) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", request.getModel() != null ? request.getModel() : "llama2");
            requestBody.put("prompt", request.getPrompt());
            requestBody.put("stream", false);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Send request to Ollama
            ResponseEntity<Map> response = restTemplate.postForEntity(
                OLLAMA_URL,
                entity,
                Map.class
            );

            // Return response
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("response", response.getBody().get("response"));
            result.put("model", response.getBody().get("model"));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }

    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> listModels() {
        try {
            String modelsUrl = "http://localhost:11439/api/tags";
            ResponseEntity<Map> response = restTemplate.getForEntity(modelsUrl, Map.class);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("models", response.getBody());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }
}

// Request DTO
class PromptRequest {
    private String prompt;
    private String model;

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
