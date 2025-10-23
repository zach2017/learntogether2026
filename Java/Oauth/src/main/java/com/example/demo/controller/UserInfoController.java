package com.example.demo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

/**
 * REST controller to provide information about the currently authenticated user.
 */
@RestController
public class UserInfoController {

    /**
     * Endpoint to get the details of the authenticated user.
     * This endpoint is protected by Spring Security, so only authenticated users can access it.
     *
     * @param principal The OAuth2User principal object injected by Spring Security,
     * containing user attributes and authorities from the OIDC token.
     * @return A map containing the user's name and authorities (roles).
     */
    @GetMapping("/api/user")
    public Map<String, Object> getUserInfo(@AuthenticationPrincipal OAuth2User principal) {
        // If the principal is null, it means the user is not authenticated.
        // Spring Security's default behavior for protected endpoints should prevent this,
        // but it's good practice to handle it.
        if (principal == null) {
            return Collections.singletonMap("error", "User not authenticated");
        }

        // The attributes available depend on the claims configured in your OIDC provider (Keycloak).
        // Common claims include 'name', 'given_name', 'family_name', 'email', 'preferred_username'.
        // We use "name" here as a general example.
        return Map.of(
            "name", principal.getAttribute("name"),
            "authorities", principal.getAuthorities()
        );
    }
}
