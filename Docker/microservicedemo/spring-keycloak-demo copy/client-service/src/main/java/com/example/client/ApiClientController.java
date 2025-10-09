package com.example.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/client")
public class ApiClientController {

    private final WebClient webClient;
    private final String apiBaseUrl;

    public ApiClientController(WebClient.Builder builder,
                               @Value("${api.base-url}") String apiBaseUrl) {
        this.webClient = builder.build();
        this.apiBaseUrl = apiBaseUrl;
    }

    @GetMapping("/public")
    public Mono<String> callPublic() {
        return webClient.get()
                .uri(apiBaseUrl + "/public-data")
                .retrieve()
                .bodyToMono(String.class);
    }

    @GetMapping("/secure")
    public Mono<String> callSecure(@RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient authorizedClient) {
        return webClient.get()
                .uri(apiBaseUrl + "/secure-data")
                .headers(h -> h.setBearerAuth(authorizedClient.getAccessToken().getTokenValue()))
                .retrieve()
                .bodyToMono(String.class);
    }
}
