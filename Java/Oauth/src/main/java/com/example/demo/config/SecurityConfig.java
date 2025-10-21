package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        // Allow error & login endpoints
        .requestMatchers("/error", "/login**").permitAll()
        // Everything else (including static /index.html) requires auth
        .anyRequest().authenticated()
      )
      // OAuth2 login via Keycloak
      .oauth2Login(Customizer.withDefaults())
      // Enable logout (RP-initiated logout will redirect to Keycloak if configured)
      .logout(logout -> logout.logoutSuccessUrl("/").permitAll())
      // CSRF default is fine for static site; keep enabled
      .csrf(csrf -> csrf.ignoringRequestMatchers("/actuator/**")); // optional

    return http.build();
  }
}
