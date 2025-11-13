package com.example.resource;
import org.springframework.web.bind.annotation.*;
@RestController
public class HelloController {
 @GetMapping("/public") public String pub(){return "public";}
}
