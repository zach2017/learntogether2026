package com.example.oauth.controller;

import com.example.oauth.service.TokenService;
import com.nimbusds.jose.jwk.JWKSet;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
public class OAuthController {
    
    private final TokenService tokenService;
    
    public OAuthController(TokenService tokenService) {
        this.tokenService = tokenService;
    }
    private static final String STATIC_USERNAME = "testuser";
    private static final String STATIC_PASSWORD = "password123";
    private static final String STATIC_CLIENT_ID = "test-client";
    private static final String STATIC_CLIENT_SECRET = "test-secret";
    
    // Token endpoint - handles password and client_credentials grants
    @PostMapping(value = "/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> token(
            @RequestParam("grant_type") String grantType,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "client_id", required = false) String clientId,
            @RequestParam(value = "client_secret", required = false) String clientSecret,
            @RequestParam(value = "refresh_token", required = false) String refreshToken,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Extract client credentials from Authorization header if present
        if (authHeader != null && authHeader.startsWith("Basic ")) {
            String credentials = new String(Base64.getDecoder().decode(authHeader.substring(6)));
            String[] parts = credentials.split(":");
            if (parts.length == 2) {
                clientId = parts[0];
                clientSecret = parts[1];
            }
        }
        
        // Validate client credentials
        if (!STATIC_CLIENT_ID.equals(clientId) || !STATIC_CLIENT_SECRET.equals(clientSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid_client"));
        }
        
        Map<String, Object> response = new HashMap<>();
        
        switch (grantType) {
            case "password":
                if (!STATIC_USERNAME.equals(username) || !STATIC_PASSWORD.equals(password)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "invalid_credentials"));
                }
                break;
                
            case "client_credentials":
                // Client already validated above
                break;
                
            case "authorization_code":
                // For simplicity, accept any code
                if (code == null || code.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "invalid_grant"));
                }
                break;
                
            case "refresh_token":
                // For simplicity, accept any refresh token
                if (refreshToken == null || refreshToken.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "invalid_grant"));
                }
                break;
                
            default:
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "unsupported_grant_type"));
        }
        
        String accessToken = tokenService.generateAccessToken(STATIC_USERNAME, clientId);
        String idToken = tokenService.generateIdToken(STATIC_USERNAME, clientId, null);
        String newRefreshToken = tokenService.generateRefreshToken();
        
        response.put("access_token", accessToken);
        response.put("id_token", idToken);
        response.put("token_type", "Bearer");
        response.put("expires_in", 3600);
        response.put("refresh_token", newRefreshToken);
        response.put("scope", "openid profile email");
        
        return ResponseEntity.ok(response);
    }
    
    // Authorization endpoint (simplified - returns code directly)
    @GetMapping("/authorize")
    public ResponseEntity<Map<String, String>> authorize(
            @RequestParam("response_type") String responseType,
            @RequestParam("client_id") String clientId,
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "nonce", required = false) String nonce) {
        
        if (!STATIC_CLIENT_ID.equals(clientId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid_client"));
        }
        
        Map<String, String> response = new HashMap<>();
        
        if ("code".equals(responseType)) {
            String code = "mock-auth-code-" + System.currentTimeMillis();
            response.put("code", code);
            response.put("redirect_uri", redirectUri);
            if (state != null) {
                response.put("state", state);
            }
        } else if ("token".equals(responseType) || "id_token".equals(responseType)) {
            String accessToken = tokenService.generateAccessToken(STATIC_USERNAME, clientId);
            String idToken = tokenService.generateIdToken(STATIC_USERNAME, clientId, nonce);
            response.put("access_token", accessToken);
            response.put("id_token", idToken);
            response.put("token_type", "Bearer");
            response.put("expires_in", "3600");
            if (state != null) {
                response.put("state", state);
            }
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "unsupported_response_type"));
        }
        
        return ResponseEntity.ok(response);
    }
    
    // JWKS endpoint - returns public keys for token validation
    @GetMapping(value = "/certs", produces = "application/json")
    public ResponseEntity<Map<String, Object>> jwks() {
        JWKSet jwkSet = tokenService.getJwkSet();
        return ResponseEntity.ok(jwkSet.toJSONObject());
    }
    
    // UserInfo endpoint
    @GetMapping("/userinfo")
    public ResponseEntity<Map<String, Object>> userInfo(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid_token"));
        }
        
        String token = authHeader.substring(7);
        if (!tokenService.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "invalid_token"));
        }
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("sub", STATIC_USERNAME);
        userInfo.put("preferred_username", STATIC_USERNAME);
        userInfo.put("name", "Test User");
        userInfo.put("given_name", "Test");
        userInfo.put("family_name", "User");
        userInfo.put("email", STATIC_USERNAME + "@example.com");
        userInfo.put("email_verified", true);
        userInfo.put("roles", new String[]{"USER", "ADMIN", "UPLOAD_ONLY"});
        userInfo.put("groups", new String[]{"ADMIN", "USER"});
        
        return ResponseEntity.ok(userInfo);
    }
    
    // Introspection endpoint
    @PostMapping(value = "/introspect", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> introspect(
            @RequestParam("token") String token,
            @RequestParam(value = "token_type_hint", required = false) String tokenTypeHint) {
        
        boolean active = tokenService.validateToken(token);
        
        Map<String, Object> response = new HashMap<>();
        response.put("active", active);
        
        if (active) {
            response.put("scope", "openid profile email");
            response.put("username", STATIC_USERNAME);
            response.put("exp", System.currentTimeMillis() / 1000 + 3600);
            response.put("iat", System.currentTimeMillis() / 1000);
            response.put("sub", STATIC_USERNAME);
            response.put("aud", STATIC_CLIENT_ID);
            response.put("iss", "http://localhost:8080");
            response.put("jti", "mock-jti-" + System.currentTimeMillis());
            response.put("token_type", "Bearer");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Revocation endpoint
    @PostMapping(value = "/revoke", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Void> revoke(
            @RequestParam("token") String token,
            @RequestParam(value = "token_type_hint", required = false) String tokenTypeHint) {
        
        // In a real implementation, you would invalidate the token
        // For this mock, we just return success
        return ResponseEntity.ok().build();
    }
    
    // Login endpoint (simple form-based login for testing)
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> credentials) {
        
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        if (!STATIC_USERNAME.equals(username) || !STATIC_PASSWORD.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
        
        String accessToken = tokenService.generateAccessToken(username, STATIC_CLIENT_ID);
        String idToken = tokenService.generateIdToken(username, STATIC_CLIENT_ID, null);
        String refreshToken = tokenService.generateRefreshToken();
        
        Map<String, Object> response = new HashMap<>();
        response.put("access_token", accessToken);
        response.put("id_token", idToken);
        response.put("refresh_token", refreshToken);
        response.put("token_type", "Bearer");
        response.put("expires_in", 3600);
        response.put("user", Map.of(
                "username", username,
                "email", username + "@example.com",
                "roles", new String[]{"USER", "ADMIN", "UPLOAD_ONLY"},
                "groups", new String[]{"ADMIN", "USER"}
        ));
        
        return ResponseEntity.ok(response);
    }
}