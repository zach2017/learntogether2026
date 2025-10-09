package com.example.api.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OwnerController {

    @GetMapping("/public-data")
    public String publicData() {
        return "This endpoint is public.";
    }

    @GetMapping("/secure-data")
    @PreAuthorize("hasRole('owner')")
    public String secureData() {
        return "Welcome, Owner! You have access to protected API data.";
    }
}
