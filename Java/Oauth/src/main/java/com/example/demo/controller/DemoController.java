package com.example.demo.controller;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/api")
public class DemoController {

 @GetMapping("/user/me")
    public String getUserDetails(@AuthenticationPrincipal OidcUser principal) {
        if (principal == null) {
            return "none";
        }

      try {  // Get the authorities (roles) you mapped in SecurityConfig
        // This will return a set of strings like ["ROLE_USER", "ROLE_ADMIN"]
        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        StringBuilder sb = new StringBuilder();
        
        for (String role : roles) {
                  if (sb.length() > 0) {
                     sb.append(", "); // Add separator *before* the next element
               }
                sb.append(role);
        }
        return sb.toString();
      } catch (Exception e) {
        log.info(e.toString());
        return e.toString();
      }
    }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/admin/secret")
  public String adminOnly() { return "only admins"; }
}
