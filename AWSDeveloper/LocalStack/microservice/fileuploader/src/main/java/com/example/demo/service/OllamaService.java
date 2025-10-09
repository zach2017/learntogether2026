package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.example.demo.data.OllamaGenerateResponse;
import com.example.demo.data.OllamaGenerateRequest;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
public class OllamaService {

    private final RestTemplate restTemplate = new RestTemplate();
    
    // The URL of your running Ollama instance
    private final String ollamaApiUrl = "http://localhost:11434/api/generate";
    private static OllamaService instance;
    /**
     * Sends a prompt and an image file to the Ollama API.
     *
     * @param model The multimodal model to use (e.g., "llava").
     * @param prompt The text prompt to send with the image.
     * @param imageFile The image file to be analyzed.
     * @return The response from the Ollama model.
     * @throws IOException If there is an error reading the image file.
     */
    public OllamaGenerateResponse generate(String model, String prompt, MultipartFile imageFile) throws IOException {
        // 1. Read the image file and encode it to Base64
        byte[] imageBytes = imageFile.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // 2. Create the request payload
        OllamaGenerateRequest requestPayload = new OllamaGenerateRequest(
            model,
            prompt,
            List.of(base64Image), // The API expects a list of images
            false // We want a single, complete response
        );

        // 3. Set up HTTP headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 4. Create the HTTP entity with the payload and headers
        HttpEntity<OllamaGenerateRequest> entity = new HttpEntity<>(requestPayload, headers);

        // 5. Make the POST request and get the response
        return restTemplate.postForObject(ollamaApiUrl, entity, OllamaGenerateResponse.class);
    }

      @PostConstruct
    private void init() {
        instance = this;
    }

    // 3. Static getter method to access the instance
    public static OllamaService getInstance() {
        if (instance == null) {
            throw new IllegalStateException("OllamaService has not been initialized by Spring.");
        }
        return instance;
    }


}