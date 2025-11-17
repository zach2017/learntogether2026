package com.example.demo.web;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public String hello(@AuthenticationPrincipal JwtAuthenticationToken jwt){
        return "Hello " + jwt.getName();
    }
}
