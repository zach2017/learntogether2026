package com.example.resource.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ProtectedResourceController {
    
    // Public endpoint - no authentication required
    @GetMapping("/public/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "Resource Server");
    }
    
    // User endpoint - requires USER or ADMIN role
    @GetMapping("/user/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public Map<String, Object> getUserProfile(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", jwt.getClaimAsString("preferred_username"));
        profile.put("email", jwt.getClaimAsString("email"));
        profile.put("name", jwt.getClaimAsString("name"));
        profile.put("authorities", authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList()));
        
        return profile;
    }
    
    // Admin endpoint - requires ADMIN role
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAdminData(Authentication authentication) {
        return Map.of(
            "message", "Admin access granted",
            "user", authentication.getName(),
            "authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList())
        );
    }
    
    // Upload endpoint - requires UPLOAD_ONLY role
    @PostMapping("/upload/file")
    @PreAuthorize("hasRole('UPLOAD_ONLY')")
    public Map<String, String> uploadFile(Authentication authentication) {
        return Map.of(
            "message", "Upload permission granted",
            "user", authentication.getName(),
            "status", "success"
        );
    }
    
    // Endpoint requiring specific group membership
    @GetMapping("/group/admin-only")
    @PreAuthorize("hasAuthority('GROUP_ADMIN')")
    public Map<String, String> adminGroupAccess(Authentication authentication) {
        return Map.of(
            "message", "Admin group access granted",
            "user", authentication.getName()
        );
    }
    
    // Endpoint requiring specific scope
    @GetMapping("/scope/profile")
    @PreAuthorize("hasAuthority('SCOPE_profile')")
    public Map<String, Object> getScopedProfile(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        
        return Map.of(
            "username", jwt.getClaimAsString("preferred_username"),
            "scopes", jwt.getClaimAsString("scope"),
            "message", "Profile scope access granted"
        );
    }
    
    // General authenticated endpoint
    @GetMapping("/authenticated")
    public Map<String, Object> getAuthenticatedData(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Authenticated access");
        data.put("subject", jwt.getSubject());
        data.put("issuer", jwt.getIssuer());
        data.put("authorities", authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList()));
        data.put("tokenExpiry", jwt.getExpiresAt());
        
        return data;
    }
}
