package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class ErrorController {

  @GetMapping("/error")
  public String error() { return "Error"; }

}
