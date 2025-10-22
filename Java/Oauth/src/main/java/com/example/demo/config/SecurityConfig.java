package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.Collectors;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/error", "/login**").permitAll()
        .requestMatchers("/admin/**").hasRole("ADMIN")
        .requestMatchers("/user/**").hasAnyRole("USER","ADMIN")
        .anyRequest().authenticated()
      )
      .oauth2Login(oauth -> oauth
        .userInfoEndpoint(userInfo -> userInfo
          .oidcUserService(this.keycloakRolesOidcUserService())  // <-- now returns interface type
        )
      )
      .logout(logout -> logout.logoutSuccessUrl("/").permitAll());

    return http.build();
  }

  /** Return the interface type, not OidcUserService concrete class. */
  private OAuth2UserService<OidcUserRequest, OidcUser> keycloakRolesOidcUserService() {
    OidcUserService delegate = new OidcUserService();

    return (OidcUserRequest userRequest) -> {
      OidcUser oidcUser = delegate.loadUser(userRequest);

      Map<String, Object> claims = new HashMap<>(oidcUser.getClaims());
      userRequest.getIdToken().getClaims().forEach(claims::putIfAbsent);

      Set<String> roles = new HashSet<>();

      Object realmAccess = claims.get("realm_access");
      if (realmAccess instanceof Map<?, ?> m) {
        Object realmRoles = m.get("roles");
        if (realmRoles instanceof Collection<?> c) {
          c.forEach(r -> roles.add(String.valueOf(r)));
        }
      }

      Object resourceAccess = claims.get("resource_access");
      if (resourceAccess instanceof Map<?, ?> m) {
        String clientId = userRequest.getClientRegistration().getClientId();
        Object clientEntry = m.get(clientId);
        if (clientEntry instanceof Map<?, ?> cm) {
          Object clientRoles = cm.get("roles");
          if (clientRoles instanceof Collection<?> c) {
            c.forEach(r -> roles.add(String.valueOf(r)));
          }
        }
      }

      Set<GrantedAuthority> mapped =
          roles.stream()
               .filter(Objects::nonNull)
               .map(String::trim)
               .filter(s -> !s.isEmpty())
               .map(s -> "ROLE_" + s.toUpperCase())
               .map(SimpleGrantedAuthority::new)
               .collect(Collectors.toSet());

      Set<GrantedAuthority> combined = new HashSet<>(oidcUser.getAuthorities());
      combined.addAll(mapped);

      // Use preferred_username if present; fall back to "sub"
      String nameAttribute = oidcUser.getUserInfo() != null && oidcUser.getUserInfo().hasClaim("preferred_username")
              ? "preferred_username" : "sub";

      return new DefaultOidcUser(combined, userRequest.getIdToken(), oidcUser.getUserInfo(), nameAttribute);
    };
  }
}
