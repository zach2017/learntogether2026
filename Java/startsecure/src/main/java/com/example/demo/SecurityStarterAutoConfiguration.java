package com.example.demo;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.*;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@AutoConfiguration
@EnableConfigurationProperties(SecurityStarterProperties.class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnClass({ SecurityFilterChain.class, HttpSecurity.class })
public class SecurityStarterAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean(SecurityFilterChain.class)
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      SecurityStarterProperties props) throws Exception {

    if (!props.enabled) {
      http.csrf(AbstractHttpConfigurer::disable);
    }

    http.cors(Customizer.withDefaults());

    if (props.stateless) {
      http.sessionManagement(sm -> sm.sessionCreationPolicy(
          org.springframework.security.config.http.SessionCreationPolicy.STATELESS));
    }

    // Authorization
    http.authorizeHttpRequests(reg -> reg
        .requestMatchers(props.permitAll.toArray(String[]::new)).permitAll()
        .anyRequest().authenticated()
    );

    // Optional: HTTP Basic (dev only)
    if (props.httpBasic) {
      http.httpBasic(Customizer.withDefaults());
    }

    // If issuer configured, turn on Resource Server JWT
    if (props.issuerUri != null && !props.issuerUri.isBlank()) {
      http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    } else {
      // Otherwise, try to detect if standard Boot property is present
      // (spring.security.oauth2.resourceserver.jwt.issuer-uri)
      // Boot will wire JwtDecoder automatically if that property exists.
      try {
        Class.forName("org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken");
        http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
      } catch (ClassNotFoundException ignore) {
        // No JWT on classpath -> leave as non-JWT chain (e.g., form login if app adds it)
      }
    }

    return http.build();
  }
}
