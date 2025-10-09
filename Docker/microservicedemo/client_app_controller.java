package com.example.clientapp.controller;

import com.example.clientapp.service.ResourceServerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
public class HomeController {

    @Autowired
    private ResourceServerService resourceServerService;

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/home")
    public String home(@AuthenticationPrincipal OidcUser user, Model model) {
        model.addAttribute("username", user.getPreferredUsername());
        model.addAttribute("email", user.getEmail());
        model.addAttribute("name", user.getFullName());
        model.addAttribute("roles", user.getClaimAsStringList("roles"));
        return "home";
    }

    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal OidcUser user, Model model) {
        try {
            Map<String, Object> profileData = resourceServerService.getUserProfile();
            model.addAttribute("profileData", profileData);
            model.addAttribute("error", null);
        } catch (Exception e) {
            model.addAttribute("error", "Failed to fetch profile: " + e.getMessage());
        }
        return "profile";
    }

    @GetMapping("/owner-data")
    public String ownerData(Model model) {
        try {
            Map<String, Object> ownerData = resourceServerService.getOwnerData();
            model.addAttribute("ownerData", ownerData);
            model.addAttribute("error", null);
        } catch (Exception e) {
            model.addAttribute("error", "Access Denied: " + e.getMessage());
            model.addAttribute("message", "Only users with OWNER role can access this resource");
        }
        return "owner-data";
    }

    @GetMapping("/public-info")
    public String publicInfo(Model model) {
        try {
            Map<String, Object> publicData = resourceServerService.getPublicInfo();
            model.addAttribute("publicData", publicData);
        } catch (Exception e) {
            model.addAttribute("error", "Failed to fetch public info: " + e.getMessage());
        }
        return "public-info";
    }
}
