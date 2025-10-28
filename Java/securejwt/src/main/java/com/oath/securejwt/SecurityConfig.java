// src/main/java/com/example/demo/config/SecurityConfig.java
package com.oath.securejwt;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
  private String issuerUri;

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        // Allow the React static files to load publicly; React will force login client-side
        .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico").permitAll()
        // Protect API with JWT
        .requestMatchers("/api/**").authenticated()
        .anyRequest().permitAll()
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

    return http.build();
  }

  @Bean
    public JwtDecoder jwtDecoder() {
        // This creates the JwtDecoder bean manually
        return JwtDecoders.fromIssuerLocation(issuerUri);
 
      }
}
