package com.oath.securejwt;
// src/main/java/com/example/demo/web/HelloController.java

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

  @GetMapping("/api/hello")
  public String hello(@AuthenticationPrincipal Jwt jwt) {
    // Preferred username claim varies by realm mapping; often "preferred_username"
    String name = jwt.getClaimAsString("preferred_username");
    if (name == null) name = jwt.getSubject();
    return "Hello, " + name;
  }
}
