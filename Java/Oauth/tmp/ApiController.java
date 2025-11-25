package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> response = new HashMap<>();
        response.put("username", jwt.getSubject());
        response.put("email", jwt.getClaim("email"));
        response.put("authorities", jwt.getClaim("roles"));
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("principal", authentication.getName());
        response.put("authorities", authentication.getAuthorities());
        response.put("authenticated", authentication.isAuthenticated());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getData() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "This is protected API data");
        response.put("data", Map.of(
            "items", new String[]{"item1", "item2", "item3"},
            "count", 3
        ));
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitData(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Data received successfully");
        response.put("receivedData", payload);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "API Service");
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
}
