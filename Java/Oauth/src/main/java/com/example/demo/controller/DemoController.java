package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DemoController {

  @GetMapping("/me")
  public String me() { return "hello, authenticated user"; }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/admin/secret")
  public String adminOnly() { return "only admins"; }
}
