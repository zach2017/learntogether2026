Got it — you want to switch from “OAuth2 Login (client)” to a pure **Resource Server (JWT)** setup that’s driven only by the single property `spring.security.oauth2.resourceserver.jwt.issuer-uri`, and update your `SecurityConfig.java` accordingly.

Quick heads-up: a **Resource Server** does not do browser redirects to Keycloak. It expects an `Authorization: Bearer <JWT>` on requests (great for APIs/SPAs). If you were using OAuth login to protect a server-rendered `/index.html`, that redirect behavior goes away when you switch to resource server.

---

# 1) application.yml (only the one line you asked for)

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8081/realms/demorealm
```

* Remove the entire `oauth2.client` section (`registration` / `provider`) you showed earlier.

**Dependencies (Gradle or Maven)**
Make sure you have:

* `spring-boot-starter-security`
* `spring-boot-starter-oauth2-resource-server`

---

# 2) Replace your SecurityConfig.java

Here’s a drop-in replacement for your current file (you uploaded a version that uses `oauth2Login`). This version turns your app into a **JWT resource server** and maps Keycloak roles so you can use `hasRole()` / `hasAuthority()`:

```java
package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    // Typical API-style security: stateless, JWT bearer required unless explicitly permitted
    http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/error", "/actuator/health").permitAll()
        // expose static assets if you want them public; otherwise they will also need a Bearer token
        // .requestMatchers("/index.html", "/assets/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtAuthenticationConverter()))
      );

    return http.build();
  }

  /**
   * Combine standard "scope" authorities with Keycloak realm/client roles.
   * - Adds SCOPE_* for OAuth scopes (default behavior)
   * - Adds ROLE_* for Keycloak realm_access.roles
   * - Adds ROLE_* for Keycloak resource_access.{client}.roles (optional, included)
   */
  private JwtAuthenticationConverter keycloakJwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
    // Optional: keep default "SCOPE_" prefix; you can change if you prefer
    // scopes.setAuthorityPrefix("SCOPE_");
    // scopes.setAuthoritiesClaimName("scope"); // defaults handle "scope"/"scp"

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
      Collection<GrantedAuthority> base = scopes.convert(jwt);

      // Realm roles
      Collection<String> realmRoles = Optional.ofNullable(jwt.getClaim("realm_access"))
        .map(map -> (Map<?, ?>) map)
        .map(m -> (Collection<String>) m.getOrDefault("roles", Collections.emptyList()))
        .orElse(Collections.emptyList());

      // Client roles (aggregate across clients)
      Map<String, Object> resourceAccess = Optional.ofNullable(jwt.getClaim("resource_access"))
        .map(map -> (Map<String, Object>) map)
        .orElse(Collections.emptyMap());

      Collection<String> clientRoles = resourceAccess.values().stream()
        .map(v -> (Map<?, ?>) v)
        .map(m -> (Collection<String>) m.getOrDefault("roles", Collections.emptyList()))
        .flatMap(Collection::stream)
        .collect(Collectors.toSet());

      Set<String> roleAuthorities = new HashSet<>();
      realmRoles.forEach(r -> roleAuthorities.add("ROLE_" + r));
      clientRoles.forEach(r -> roleAuthorities.add("ROLE_" + r));

      // Merge all authorities
      return new ArrayList<>(base) {{
        addAll(roleAuthorities.stream().map(org.springframework.security.core.authority.SimpleGrantedAuthority::new).toList());
      }};
    });
    return converter;
  }
}
```

### How authorization changes

* With the converter above, you can now do:

  * `hasAuthority("SCOPE_email")` (for OAuth scopes), and
  * `hasRole("admin")` if the token has `realm_access.roles` (or client roles) including `admin`.

Example:

```java
.authorizeHttpRequests(auth -> auth
  .requestMatchers("/public/**").permitAll()
  .requestMatchers("/admin/**").hasRole("admin")
  .anyRequest().authenticated()
)
```

---

# 3) Behavior change to be aware of (important)

* **No redirect to Keycloak**: Resource server does not handle `/login`. Requests lacking a valid **Bearer token** get `401 Unauthorized` instead of a browser SSO flow.
* **Protecting `index.html`**: If you still want an HTML page that triggers login, keep the **client** configuration (oauth2Login) for that web tier, or move to a SPA that acquires a token (via PKCE) and calls this resource server API with the Bearer token.

  * Common pattern: **SPA (OAuth client)** ➜ gets token ➜ calls **API (resource server)**.
  * If you insist on locking down static files with JWT, the browser must include a Bearer token on those requests (e.g., by serving HTML through a controller that checks the token).

---

# 4) Optional audience validation (Keycloak “aud”)

If you want to enforce that tokens are intended for your API, you can add an audience validator (replace `"your-api-audience"` with your Keycloak client ID used for issuing access tokens to this resource):

```java
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;

@Bean
JwtDecoder jwtDecoder(org.springframework.core.env.Environment env) {
  NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(
      env.getProperty("spring.security.oauth2.resourceserver.jwt.issuer-uri"));

  OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(
      env.getProperty("spring.security.oauth2.resourceserver.jwt.issuer-uri"));
  OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<List<String>>(
      "aud", aud -> aud != null && aud.contains("your-api-audience"));

  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, audience));
  return decoder;
}
```

---

# 5) How to call your endpoints now

* Obtain an **access token** from Keycloak (client credentials, password, or SPA PKCE).
* Call your API with:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

That’s it. Your app now uses only the single issuer-URI property for JWT validation, with a resource-server security chain and sane Keycloak role mapping.
