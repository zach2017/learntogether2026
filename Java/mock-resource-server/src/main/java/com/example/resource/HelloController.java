package com.example.resource;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/public")
    public Map<String, String> publicEndpoint() {
        return Map.of("message", "This is public");
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return Map.of(
                    "sub", jwt.getSubject(),
                    "claims", jwt.getClaims()
            );
        }
        return Map.of("user", authentication.getName());
    }

    @GetMapping("/admin")
    public Map<String, String> admin() {
        return Map.of("message", "Hello ADMIN, you have ADMIN role");
    }

    @GetMapping("/upload")
    public Map<String, String> upload() {
        return Map.of("message", "Hello, you have UPLOAD role");
    }
}
