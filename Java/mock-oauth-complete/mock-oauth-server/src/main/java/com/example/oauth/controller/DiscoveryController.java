package com.example.oauth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
public class DiscoveryController {
    
    @Value("${server.port:8080}")
    private String serverPort;
    
    @GetMapping("/.well-known/openid-configuration")
    public ResponseEntity<Map<String, Object>> openIdConfiguration() {
        String baseUrl = "http://localhost:" + serverPort;
        
        Map<String, Object> config = new HashMap<>();
        config.put("issuer", baseUrl);
        config.put("authorization_endpoint", baseUrl + "/authorize");
        config.put("token_endpoint", baseUrl + "/token");
        config.put("userinfo_endpoint", baseUrl + "/userinfo");
        config.put("jwks_uri", baseUrl + "/certs");
        config.put("introspection_endpoint", baseUrl + "/introspect");
        config.put("revocation_endpoint", baseUrl + "/revoke");
        
        config.put("response_types_supported", Arrays.asList(
                "code",
                "token",
                "id_token",
                "code token",
                "code id_token",
                "token id_token",
                "code token id_token"
        ));
        
        config.put("grant_types_supported", Arrays.asList(
                "authorization_code",
                "implicit",
                "password",
                "client_credentials",
                "refresh_token"
        ));
        
        config.put("subject_types_supported", Arrays.asList("public"));
        
        config.put("id_token_signing_alg_values_supported", Arrays.asList("RS256"));
        
        config.put("scopes_supported", Arrays.asList(
                "openid",
                "profile",
                "email",
                "address",
                "phone",
                "offline_access"
        ));
        
        config.put("token_endpoint_auth_methods_supported", Arrays.asList(
                "client_secret_basic",
                "client_secret_post"
        ));
        
        config.put("claims_supported", Arrays.asList(
                "sub",
                "iss",
                "auth_time",
                "name",
                "given_name",
                "family_name",
                "preferred_username",
                "email",
                "email_verified",
                "roles",
                "groups"
        ));
        
        config.put("code_challenge_methods_supported", Arrays.asList("S256"));
        
        return ResponseEntity.ok(config);
    }
}