package com.example.clientapp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

import static org.springframework.security.oauth2.client.web.reactive.function.client.ServletOAuth2AuthorizedClientExchangeFilterFunction.clientRegistrationId;

@Service
public class ResourceServerService {

    @Autowired
    private WebClient webClient;

    @Value("${resource.server.url}")
    private String resourceServerUrl;

    public Map<String, Object> getUserProfile() {
        return webClient
                .get()
                .uri(resourceServerUrl + "/api/user/profile")
                .attributes(clientRegistrationId("keycloak"))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map<String, Object> getOwnerData() {
        return webClient
                .get()
                .uri(resourceServerUrl + "/api/owner/data")
                .attributes(clientRegistrationId("keycloak"))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map<String, Object> getPublicInfo() {
        return webClient
                .get()
                .uri(resourceServerUrl + "/api/public/info")
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
