package com.tutorial.future.service.ollama;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OllamaEMPKeywordService {
    
    private static final String OLLAMA_BASE_URL = "http://localhost:11434";
    private static final String MODEL = "mistral";
    private final RestTemplate restTemplate;
    
    // EMP Keyword Types
    private enum EMPKeywordType {
        ELECTROMAGNETIC("Electromagnetic", "electromagnetic, EMI, magnetic field, RF, radio frequency"),
        PULSE("Pulse", "pulse, burst, transient, surge, spike"),
        DEVICE("Device", "device, equipment, electronics, circuit, system"),
        EFFECT("Effect", "damage, disruption, failure, malfunction, interference"),
        PROTECTION("Protection", "shielding, faraday cage, grounding, surge protection, hardening"),
        FREQUENCY("Frequency", "GHz, MHz, kHz, Hz, frequency spectrum"),
        NUCLEAR("Nuclear", "nuclear, detonation, blast, radiation, explosion"),
        THREAT("Threat", "threat, vulnerability, risk, exposure, hazard");
        
        final String name;
        final String keywords;
        
        EMPKeywordType(String name, String keywords) {
            this.name = name;
            this.keywords = keywords;
        }
    }
    
    public OllamaEMPKeywordService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Sends text to Ollama and extracts EMP-related keywords
     */
    public EMPKeywordResult extractKeywords(String inputText) throws Exception {
        String prompt = buildPrompt(inputText);
        String response = callOllama(prompt);
        return parseEMPKeywords(response, inputText);
    }
    
    /**
     * Builds the prompt for Ollama
     */
    private String buildPrompt(String inputText) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert in electromagnetic pulse (EMP) analysis. ");
        prompt.append("Extract and categorize keywords from the following text based on these EMP keyword types:\n\n");
        
        for (EMPKeywordType type : EMPKeywordType.values()) {
            prompt.append("- ").append(type.name).append(": ").append(type.keywords).append("\n");
        }
        
        prompt.append("\n\nText to analyze:\n\"").append(inputText).append("\"\n\n");
        prompt.append("Respond with a JSON object containing the found keywords organized by type. ");
        prompt.append("Format: {\"type_name\": [\"keyword1\", \"keyword2\"], ...}\n");
        prompt.append("Only include types where you found matching keywords. Return only valid JSON, nothing else.");
        
        return prompt.toString();
    }
    
    /**
     * Calls the Ollama service using RestTemplate
     */
    private String callOllama(String prompt) throws Exception {
        String url = OLLAMA_BASE_URL + "/api/generate";
        
        // Build request body as a string
        String requestBody = buildRequestBody(prompt);
        
        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            OllamaResponse ollamaResponse = restTemplate.postForObject(
                url,
                entity,
                OllamaResponse.class
            );
            
            if (ollamaResponse != null) {
                return ollamaResponse.getResponse();
            }
            throw new RuntimeException("Empty response from Ollama");
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling Ollama service: " + e.getMessage(), e);
        }
    }
    
    /**
     * Builds JSON request body as string
     */
    private String buildRequestBody(String prompt) {
        return "{" +
            "\"model\": \"" + escapeJson(MODEL) + "\"," +
            "\"prompt\": \"" + escapeJson(prompt) + "\"," +
            "\"stream\": false," +
            "\"temperature\": 0.3" +
        "}";
    }
    
    /**
     * Escapes special characters for JSON
     */
    private String escapeJson(String input) {
        if (input == null) return "";
        return input
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\b", "\\b")
            .replace("\f", "\\f")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
    
    /**
     * Parses the Ollama response and extracts EMP keywords
     */
    private EMPKeywordResult parseEMPKeywords(String ollamaResponse, String originalText) {
        EMPKeywordResult result = new EMPKeywordResult();
        result.setOriginalText(originalText);
        result.setRawResponse(ollamaResponse);
        
        try {
            // Extract JSON from the response
            Map<String, List<String>> categorizedKeywords = parseJsonResponse(ollamaResponse);
            
            result.setCategorizedKeywords(categorizedKeywords);
            result.setSuccess(true);
            result.setMessage("Keywords extracted successfully");
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setMessage("Error parsing response: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Parses JSON response manually using string manipulation
     */
    private Map<String, List<String>> parseJsonResponse(String jsonString) throws Exception {
        Map<String, List<String>> result = new LinkedHashMap<>();
        
        // Find the JSON object boundaries
        int startIdx = jsonString.indexOf('{');
        int endIdx = jsonString.lastIndexOf('}');
        
        if (startIdx < 0 || endIdx < 0) {
            throw new RuntimeException("No JSON object found in response");
        }
        
        String jsonPart = jsonString.substring(startIdx, endIdx + 1);
        
        // Parse key-value pairs
        // Pattern: "key": ["value1", "value2", ...]
        Pattern pattern = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\\[(.*?)\\]");
        Matcher matcher = pattern.matcher(jsonPart);
        
        while (matcher.find()) {
            String key = matcher.group(1);
            String arrayContent = matcher.group(2);
            
            // Parse array values
            List<String> values = new ArrayList<>();
            Pattern valuePattern = Pattern.compile("\"([^\"]+)\"");
            Matcher valueMatcher = valuePattern.matcher(arrayContent);
            
            while (valueMatcher.find()) {
                values.add(valueMatcher.group(1));
            }
            
            if (!values.isEmpty()) {
                result.put(key, values);
            }
        }
        
        return result;
    }
    
    /**
     * Result class for keyword extraction
     */
    public static class EMPKeywordResult {
        private String originalText;
        private Map<String, List<String>> categorizedKeywords;
        private boolean success;
        private String message;
        private String rawResponse;
        
        // Getters and Setters
        public String getOriginalText() {
            return originalText;
        }
        
        public void setOriginalText(String originalText) {
            this.originalText = originalText;
        }
        
        public Map<String, List<String>> getCategorizedKeywords() {
            return categorizedKeywords;
        }
        
        public void setCategorizedKeywords(Map<String, List<String>> categorizedKeywords) {
            this.categorizedKeywords = categorizedKeywords;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public void setSuccess(boolean success) {
            this.success = success;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public String getRawResponse() {
            return rawResponse;
        }
        
        public void setRawResponse(String rawResponse) {
            this.rawResponse = rawResponse;
        }
        
        @Override
        public String toString() {
            return "EMPKeywordResult{" +
                    "success=" + success +
                    ", message='" + message + '\'' +
                    ", categorizedKeywords=" + categorizedKeywords +
                    '}';
        }
    }
    
    /**
     * Ollama API Response DTO
     */
    public static class OllamaResponse {
        private String response;
        
        public String getResponse() {
            return response;
        }
        
        public void setResponse(String response) {
            this.response = response;
        }
    }
}