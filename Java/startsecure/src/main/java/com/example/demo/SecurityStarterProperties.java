package com.example.demo;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "acme.security")
public class SecurityStarterProperties {
  /** Quick kill-switch for the whole starter. */
  public boolean enabled = true;

  /** Ant matchers that should be public. */
  public List<String> permitAll = List.of("/actuator/health", "/actuator/info");

  /** If true, disable CSRF (useful for stateless APIs). */
  public boolean csrfDisabled = true;

  /** Enables basic auth if set (for simple, dev-only use). */
  public boolean httpBasic = false;

  /** If true, configure as stateless (no session). */
  public boolean stateless = true;

  /** If present, we’ll wire resource server JWT. */
  public String issuerUri;

  // getters/setters omitted for brevity
}
