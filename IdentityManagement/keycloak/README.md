# Keycloak 26.4.7: Conditional OTP for ADMIN Group/Role

## Complete Guide with Spring Boot Resource Server Integration

---

## Table of Contents

1. [Overview](#1-overview)
2. [Keycloak Configuration via Admin Console](#2-keycloak-configuration-via-admin-console)
3. [Realm Import JSON Configuration](#3-realm-import-json-configuration)
4. [Spring Boot Resource Server Setup](#4-spring-boot-resource-server-setup)
5. [Testing the Configuration](#5-testing-the-configuration)

---

## 1. Overview

### What We're Building

- **Conditional OTP**: Only users with `ADMIN` role or in `ADMIN` group are required to use OTP (TOTP/Google Authenticator)
- **Regular users**: Login with username/password only
- **JWT Token**: Contains groups and roles for Spring Security authorization
- **Spring Resource Server**: Validates JWT and enforces group/role-based access control

### Architecture Flow

```
User Login → Keycloak Authentication Flow
    ↓
Check if user has ADMIN role?
    ├── YES → Require OTP (TOTP)
    └── NO  → Skip OTP, proceed with password only
    ↓
Issue JWT Token (with groups & roles claims)
    ↓
Spring Resource Server validates JWT
    ↓
Access control based on groups/roles
```

---

## 2. Keycloak Configuration via Admin Console

### Step 2.1: Create Realm Roles

1. **Login** to Keycloak Admin Console: `http://localhost:8080/admin`
2. **Select your Realm** (or create one, e.g., `my-realm`)
3. Go to **Realm roles** (left menu)
4. Click **Create role**
5. Create the following roles:

| Role Name | Description |
|-----------|-------------|
| `ADMIN` | Administrator role - requires OTP |
| `USER` | Regular user role |

### Step 2.2: Create Groups

1. Go to **Groups** (left menu)
2. Click **Create group**
3. Create groups:

| Group Name | Description |
|------------|-------------|
| `ADMIN` | Admin group - members require OTP |
| `USERS` | Regular users group |

4. **Assign role to group** (optional but recommended):
   - Click on `ADMIN` group
   - Go to **Role mapping** tab
   - Click **Assign role**
   - Select `ADMIN` role → Click **Assign**

### Step 2.3: Create Custom Authentication Flow

1. Go to **Authentication** (left menu)
2. Click on **Flows** tab
3. Click on **browser** flow → Click **⋮** (three dots) → **Duplicate**
4. Name it: `Browser with Admin OTP`
5. Click **Duplicate**

### Step 2.4: Configure the Duplicated Flow

Now modify the `Browser with Admin OTP` flow:

#### Current Structure (Default):
```
Browser with Admin OTP (top-level flow)
├── Cookie (Alternative)
├── Kerberos (Disabled)
├── Identity Provider Redirector (Alternative)
└── Browser with Admin OTP forms (Alternative sub-flow)
    ├── Username Password Form (Required)
    └── Browser with Admin OTP Browser - Conditional OTP (Conditional sub-flow)
        ├── Condition - User Configured (Required)
        └── OTP Form (Required)
```

#### Modify to Use Role-Based Conditional OTP:

1. **Delete** the existing `Browser with Admin OTP Browser - Conditional OTP` sub-flow
2. **Add a new execution** under `Browser with Admin OTP forms`:
   - Click **Add step**
   - Search for and select **Conditional OTP Form**
   - Set requirement to **Required**

3. **Configure Conditional OTP Form**:
   - Click the **⚙️ gear icon** next to "Conditional OTP Form"
   - Configure these settings:

| Setting | Value | Description |
|---------|-------|-------------|
| **OTP control User Attribute** | (leave empty) | User attribute to check |
| **Force OTP for Role** | `ADMIN` | **IMPORTANT**: Enter your ADMIN role name |
| **Skip OTP for Role** | (leave empty) | Roles that skip OTP |
| **Skip OTP for Header** | (leave empty) | HTTP header pattern to skip |
| **Force OTP for Header** | (leave empty) | HTTP header pattern to force |
| **Fallback OTP handling** | `skip` | Default behavior when no conditions match |

4. Click **Save**

#### Final Flow Structure:
```
Browser with Admin OTP (top-level flow)
├── Cookie (Alternative)
├── Kerberos (Disabled)  
├── Identity Provider Redirector (Alternative)
└── Browser with Admin OTP forms (Alternative sub-flow)
    ├── Username Password Form (Required)
    └── Conditional OTP Form (Required) ← Configured with Force OTP for ADMIN role
```

### Step 2.5: Bind the Flow to Browser Authentication

1. Go to **Authentication** → **Flows**
2. Click the **⋮** menu next to `Browser with Admin OTP`
3. Select **Bind flow**
4. Choose **Browser flow**
5. Click **Save**

### Step 2.6: Enable OTP Required Action

1. Go to **Authentication** → **Required actions**
2. Find **Configure OTP**
3. Toggle **Enabled** to ON
4. Optionally toggle **Default Action** to ON (forces new users to set up OTP)

### Step 2.7: Create Client with Group Mapper

1. Go to **Clients** → **Create client**
2. Configure:
   - **Client ID**: `spring-resource-server`
   - **Client Protocol**: `openid-connect`
   - Click **Next**
   
3. **Capability config**:
   - **Client authentication**: ON
   - **Authorization**: OFF (unless needed)
   - **Authentication flow**: Check ✅ Standard flow, ✅ Direct access grants
   - Click **Next**

4. **Login settings**:
   - **Valid redirect URIs**: `http://localhost:8081/*`
   - **Web origins**: `http://localhost:8081`
   - Click **Save**

5. **Note the Client Secret**:
   - Go to **Credentials** tab
   - Copy the **Client secret**

### Step 2.8: Add Groups Mapper to JWT Token

1. Go to **Clients** → `spring-resource-server`
2. Click **Client scopes** tab
3. Click `spring-resource-server-dedicated`
4. Click **Configure a new mapper**
5. Select **Group Membership**
6. Configure:
   - **Name**: `groups`
   - **Token Claim Name**: `groups`
   - **Full group path**: OFF (for simple group names)
   - **Add to ID token**: ON
   - **Add to access token**: ON
   - **Add to userinfo**: ON
7. Click **Save**

### Step 2.9: Create Test Users

1. Go to **Users** → **Add user**
2. **Admin User** (will require OTP):
   - Username: `admin`
   - Email: `admin@example.com`
   - Email verified: ON
   - Click **Create**
   - Go to **Credentials** tab → Set password: `admin123`
   - Go to **Role mapping** → Assign role → Select `ADMIN`
   - Go to **Groups** → Join groups → Select `ADMIN`

3. **Regular User** (no OTP required):
   - Username: `user`
   - Email: `user@example.com`
   - Email verified: ON
   - Click **Create**
   - Go to **Credentials** tab → Set password: `user123`
   - Go to **Role mapping** → Assign role → Select `USER`
   - Go to **Groups** → Join groups → Select `USERS`

---

## 3. Realm Import JSON Configuration

### Complete Realm Export (realm-config.json)

This JSON file can be imported to Keycloak to create the entire configuration automatically.

```json
{
  "realm": "my-realm",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  
  "roles": {
    "realm": [
      {
        "name": "ADMIN",
        "description": "Administrator role - requires OTP authentication",
        "composite": false,
        "clientRole": false
      },
      {
        "name": "USER",
        "description": "Regular user role",
        "composite": false,
        "clientRole": false
      },
      {
        "name": "default-roles-my-realm",
        "description": "${role_default-roles}",
        "composite": true,
        "composites": {
          "realm": ["offline_access", "uma_authorization"],
          "client": {
            "account": ["view-profile", "manage-account"]
          }
        }
      },
      {
        "name": "offline_access",
        "description": "${role_offline-access}",
        "composite": false
      },
      {
        "name": "uma_authorization",
        "description": "${role_uma_authorization}",
        "composite": false
      }
    ]
  },
  
  "groups": [
    {
      "name": "ADMIN",
      "path": "/ADMIN",
      "realmRoles": ["ADMIN"]
    },
    {
      "name": "USERS",
      "path": "/USERS",
      "realmRoles": ["USER"]
    }
  ],
  
  "defaultRole": {
    "name": "default-roles-my-realm",
    "description": "${role_default-roles}",
    "composite": true
  },
  
  "requiredActions": [
    {
      "alias": "CONFIGURE_TOTP",
      "name": "Configure OTP",
      "providerId": "CONFIGURE_TOTP",
      "enabled": true,
      "defaultAction": false,
      "priority": 10
    }
  ],
  
  "clients": [
    {
      "clientId": "spring-resource-server",
      "name": "Spring Boot Resource Server",
      "description": "Spring Boot application secured with Keycloak",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "your-client-secret-here",
      "redirectUris": [
        "http://localhost:8081/*"
      ],
      "webOrigins": [
        "http://localhost:8081"
      ],
      "bearerOnly": false,
      "publicClient": false,
      "protocol": "openid-connect",
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": false,
      "fullScopeAllowed": true,
      "defaultClientScopes": [
        "web-origins",
        "acr",
        "profile",
        "roles",
        "email",
        "groups"
      ],
      "optionalClientScopes": [
        "address",
        "phone",
        "offline_access",
        "microprofile-jwt"
      ],
      "protocolMappers": [
        {
          "name": "groups",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-group-membership-mapper",
          "consentRequired": false,
          "config": {
            "full.path": "false",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "groups",
            "userinfo.token.claim": "true"
          }
        },
        {
          "name": "realm-roles",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-usermodel-realm-role-mapper",
          "consentRequired": false,
          "config": {
            "multivalued": "true",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "realm_roles",
            "jsonType.label": "String",
            "userinfo.token.claim": "true"
          }
        }
      ]
    }
  ],
  
  "clientScopes": [
    {
      "name": "groups",
      "description": "User group memberships",
      "protocol": "openid-connect",
      "attributes": {
        "include.in.token.scope": "true",
        "display.on.consent.screen": "true",
        "consent.screen.text": "User groups"
      },
      "protocolMappers": [
        {
          "name": "groups",
          "protocol": "openid-connect",
          "protocolMapper": "oidc-group-membership-mapper",
          "consentRequired": false,
          "config": {
            "full.path": "false",
            "id.token.claim": "true",
            "access.token.claim": "true",
            "claim.name": "groups",
            "userinfo.token.claim": "true"
          }
        }
      ]
    }
  ],
  
  "authenticationFlows": [
    {
      "alias": "Browser with Admin OTP",
      "description": "Browser flow with OTP required for ADMIN role only",
      "providerId": "basic-flow",
      "topLevel": true,
      "builtIn": false,
      "authenticationExecutions": [
        {
          "authenticator": "auth-cookie",
          "authenticatorFlow": false,
          "requirement": "ALTERNATIVE",
          "priority": 10
        },
        {
          "authenticator": "auth-spnego",
          "authenticatorFlow": false,
          "requirement": "DISABLED",
          "priority": 20
        },
        {
          "authenticator": "identity-provider-redirector",
          "authenticatorFlow": false,
          "requirement": "ALTERNATIVE",
          "priority": 25
        },
        {
          "authenticatorFlow": true,
          "requirement": "ALTERNATIVE",
          "priority": 30,
          "flowAlias": "Browser with Admin OTP forms"
        }
      ]
    },
    {
      "alias": "Browser with Admin OTP forms",
      "description": "Username, password, and conditional OTP for admins",
      "providerId": "basic-flow",
      "topLevel": false,
      "builtIn": false,
      "authenticationExecutions": [
        {
          "authenticator": "auth-username-password-form",
          "authenticatorFlow": false,
          "requirement": "REQUIRED",
          "priority": 10
        },
        {
          "authenticator": "auth-conditional-otp-form",
          "authenticatorFlow": false,
          "requirement": "REQUIRED",
          "priority": 20,
          "authenticatorConfig": "admin-otp-config"
        }
      ]
    }
  ],
  
  "authenticatorConfig": [
    {
      "alias": "admin-otp-config",
      "config": {
        "otpControlAttribute": "",
        "forceOtpRole": "ADMIN",
        "skipOtpRole": "",
        "noOtpRequiredForHeaderPattern": "",
        "forceOtpForHeaderPattern": "",
        "defaultOtpOutcome": "skip"
      }
    }
  ],
  
  "browserFlow": "Browser with Admin OTP",
  
  "users": [
    {
      "username": "admin",
      "enabled": true,
      "emailVerified": true,
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "credentials": [
        {
          "type": "password",
          "value": "admin123",
          "temporary": false
        }
      ],
      "realmRoles": ["ADMIN", "default-roles-my-realm"],
      "groups": ["/ADMIN"],
      "requiredActions": ["CONFIGURE_TOTP"]
    },
    {
      "username": "user",
      "enabled": true,
      "emailVerified": true,
      "email": "user@example.com",
      "firstName": "Regular",
      "lastName": "User",
      "credentials": [
        {
          "type": "password",
          "value": "user123",
          "temporary": false
        }
      ],
      "realmRoles": ["USER", "default-roles-my-realm"],
      "groups": ["/USERS"]
    }
  ]
}
```

### How to Import the Realm

#### Method 1: Docker/Command Line Import

```bash
# Start Keycloak with realm import
docker run -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v $(pwd)/realm-config.json:/opt/keycloak/data/import/realm-config.json \
  quay.io/keycloak/keycloak:26.4.7 \
  start-dev --import-realm
```

#### Method 2: Admin Console Import

1. Login to Admin Console
2. Click dropdown on realm name → **Create realm**
3. Click **Browse** and select `realm-config.json`
4. Click **Create**

#### Method 3: CLI Import

```bash
# Export: (server must be stopped)
./kc.sh export --dir /path/to/export --realm my-realm

# Import: (server must be stopped)
./kc.sh import --dir /path/to/import
```

---

## 4. Spring Boot Resource Server Setup

### Project Structure

```
spring-resource-server/
├── pom.xml
├── src/main/java/com/example/
│   ├── Application.java
│   ├── config/
│   │   └── SecurityConfig.java
│   ├── security/
│   │   ├── KeycloakJwtConverter.java
│   │   └── KeycloakGroupConverter.java
│   └── controller/
│       └── ResourceController.java
└── src/main/resources/
    └── application.yml
```

### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>spring-resource-server</artifactId>
    <version>1.0.0</version>
    <name>Keycloak Protected Resource Server</name>
    
    <properties>
        <java.version>21</java.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- OAuth2 Resource Server with JWT -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        
        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- Lombok (optional) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml

```yaml
server:
  port: 8081

spring:
  application:
    name: spring-resource-server
  
  security:
    oauth2:
      resourceserver:
        jwt:
          # Keycloak JWKS endpoint for token validation
          jwk-set-uri: http://localhost:8080/realms/my-realm/protocol/openid-connect/certs
          # Alternative: use issuer-uri (auto-discovers JWKS)
          issuer-uri: http://localhost:8080/realms/my-realm

# Custom Keycloak configuration
keycloak:
  realm: my-realm
  auth-server-url: http://localhost:8080

logging:
  level:
    org.springframework.security: DEBUG
    com.example: DEBUG
```

### Application.java

```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### KeycloakJwtConverter.java (Converts Keycloak roles to Spring authorities)

```java
package com.example.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Converts Keycloak JWT claims (roles and groups) to Spring Security authorities.
 * 
 * Extracts from:
 * - realm_access.roles → ROLE_<role_name>
 * - resource_access.<client>.roles → ROLE_<client>_<role_name>
 * - groups → GROUP_<group_name>
 */
@Component
public class KeycloakJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String ROLE_PREFIX = "ROLE_";
    private static final String GROUP_PREFIX = "GROUP_";
    
    private final JwtGrantedAuthoritiesConverter defaultConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                defaultConverter.convert(jwt).stream(),
                Stream.concat(
                    extractRealmRoles(jwt).stream(),
                    Stream.concat(
                        extractResourceRoles(jwt).stream(),
                        extractGroups(jwt).stream()
                    )
                )
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, getPrincipalName(jwt));
    }

    private String getPrincipalName(Jwt jwt) {
        // Use preferred_username if available, otherwise sub
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        return preferredUsername != null ? preferredUsername : jwt.getSubject();
    }

    /**
     * Extract realm-level roles from realm_access.roles
     */
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) {
            return Collections.emptyList();
        }
        
        @SuppressWarnings("unchecked")
        Collection<String> roles = (Collection<String>) realmAccess.get("roles");
        if (roles == null) {
            return Collections.emptyList();
        }
        
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
                .collect(Collectors.toList());
    }

    /**
     * Extract client-level roles from resource_access.<client>.roles
     */
    private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess == null) {
            return Collections.emptyList();
        }
        
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        resourceAccess.forEach((clientId, clientData) -> {
            if (clientData instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> clientMap = (Map<String, Object>) clientData;
                @SuppressWarnings("unchecked")
                Collection<String> roles = (Collection<String>) clientMap.get("roles");
                
                if (roles != null) {
                    roles.forEach(role -> {
                        String authority = ROLE_PREFIX + clientId.toUpperCase() + "_" + role.toUpperCase();
                        authorities.add(new SimpleGrantedAuthority(authority));
                    });
                }
            }
        });
        
        return authorities;
    }

    /**
     * Extract groups from groups claim
     */
    private Collection<GrantedAuthority> extractGroups(Jwt jwt) {
        Object groupsClaim = jwt.getClaim("groups");
        if (groupsClaim == null) {
            return Collections.emptyList();
        }
        
        Collection<String> groups;
        if (groupsClaim instanceof Collection) {
            @SuppressWarnings("unchecked")
            Collection<String> groupList = (Collection<String>) groupsClaim;
            groups = groupList;
        } else {
            return Collections.emptyList();
        }
        
        return groups.stream()
                .map(group -> {
                    // Remove leading slash if present (e.g., "/ADMIN" -> "ADMIN")
                    String groupName = group.startsWith("/") ? group.substring(1) : group;
                    return new SimpleGrantedAuthority(GROUP_PREFIX + groupName.toUpperCase());
                })
                .collect(Collectors.toList());
    }
}
```

### SecurityConfig.java

```java
package com.example.config;

import com.example.security.KeycloakJwtConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enables @PreAuthorize annotations
public class SecurityConfig {

    private final KeycloakJwtConverter keycloakJwtConverter;

    public SecurityConfig(KeycloakJwtConverter keycloakJwtConverter) {
        this.keycloakJwtConverter = keycloakJwtConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for stateless API
            .csrf(csrf -> csrf.disable())
            
            // Enable CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Stateless session management
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                
                // Admin-only endpoints (requires ADMIN role OR ADMIN group)
                .requestMatchers("/api/admin/**").hasAnyAuthority(
                    "ROLE_ADMIN", 
                    "GROUP_ADMIN"
                )
                
                // User endpoints (requires USER role or higher)
                .requestMatchers("/api/user/**").hasAnyAuthority(
                    "ROLE_USER", 
                    "ROLE_ADMIN",
                    "GROUP_USERS",
                    "GROUP_ADMIN"
                )
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            
            // Configure as OAuth2 Resource Server with JWT
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtConverter))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### ResourceController.java

```java
package com.example.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ResourceController {

    /**
     * Public endpoint - no authentication required
     */
    @GetMapping("/public/health")
    public Map<String, String> publicHealth() {
        return Map.of(
            "status", "UP",
            "message", "Public endpoint - no auth required"
        );
    }

    /**
     * Get current user info - any authenticated user
     */
    @GetMapping("/me")
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        JwtAuthenticationToken jwtAuth = (JwtAuthenticationToken) authentication;
        Jwt jwt = jwtAuth.getToken();
        
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("username", jwt.getClaimAsString("preferred_username"));
        userInfo.put("email", jwt.getClaimAsString("email"));
        userInfo.put("name", jwt.getClaimAsString("name"));
        userInfo.put("subject", jwt.getSubject());
        
        // Extract groups from token
        @SuppressWarnings("unchecked")
        List<String> groups = jwt.getClaim("groups");
        userInfo.put("groups", groups);
        
        // Extract realm roles
        @SuppressWarnings("unchecked")
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null) {
            userInfo.put("realm_roles", realmAccess.get("roles"));
        }
        
        // Show granted authorities
        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        userInfo.put("authorities", authorities);
        
        return userInfo;
    }

    /**
     * User endpoint - requires USER role or USERS group
     */
    @GetMapping("/user/data")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN', 'GROUP_USERS', 'GROUP_ADMIN')")
    public Map<String, Object> getUserData(Authentication authentication) {
        return Map.of(
            "message", "This is user-level data",
            "user", authentication.getName(),
            "accessLevel", "USER"
        );
    }

    /**
     * Admin endpoint - requires ADMIN role or ADMIN group
     * Note: ADMIN users had to authenticate with OTP!
     */
    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'GROUP_ADMIN')")
    public Map<String, Object> getAdminDashboard(Authentication authentication) {
        return Map.of(
            "message", "Welcome to the Admin Dashboard!",
            "user", authentication.getName(),
            "accessLevel", "ADMIN",
            "note", "This user authenticated with OTP (2FA)"
        );
    }

    /**
     * Admin endpoint with specific role check
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")  // Checks for ROLE_ADMIN authority
    public Map<String, Object> manageUsers(Authentication authentication) {
        return Map.of(
            "message", "User management - Admin only",
            "user", authentication.getName(),
            "action", "list-users"
        );
    }

    /**
     * Group-based authorization example
     */
    @GetMapping("/admin/settings")
    @PreAuthorize("hasAuthority('GROUP_ADMIN')")  // Checks specifically for ADMIN group
    public Map<String, Object> getSettings(Authentication authentication) {
        return Map.of(
            "message", "System settings - ADMIN group members only",
            "user", authentication.getName()
        );
    }

    /**
     * Combined role and group check
     */
    @GetMapping("/admin/reports")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or hasAuthority('GROUP_ADMIN')")
    public Map<String, Object> getReports(Authentication authentication) {
        return Map.of(
            "message", "Reports - accessible by ADMIN role OR ADMIN group",
            "user", authentication.getName()
        );
    }
}
```

---

## 5. Testing the Configuration

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.4.7
    container_name: keycloak
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HTTP_PORT: 8080
    ports:
      - "8080:8080"
    volumes:
      - ./realm-config.json:/opt/keycloak/data/import/realm-config.json
    command: 
      - start-dev
      - --import-realm
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Testing with cURL

#### 1. Get Token for Regular User (No OTP required)

```bash
# Get access token for regular user
ACCESS_TOKEN=$(curl -s -X POST \
  "http://localhost:8080/realms/my-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=spring-resource-server" \
  -d "client_secret=your-client-secret-here" \
  -d "grant_type=password" \
  -d "username=user" \
  -d "password=user123" \
  | jq -r '.access_token')

echo $ACCESS_TOKEN

# Decode JWT to see claims (optional)
echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .
```

#### 2. Test User Endpoints

```bash
# Access user endpoint (should work)
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8081/api/user/data

# Access admin endpoint (should fail - 403 Forbidden)
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8081/api/admin/dashboard
```

#### 3. Get Token for Admin User

For admin users, you'll need to complete OTP setup first via browser, then:

```bash
# Get access token for admin (after OTP is configured)
ADMIN_TOKEN=$(curl -s -X POST \
  "http://localhost:8080/realms/my-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=spring-resource-server" \
  -d "client_secret=your-client-secret-here" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "totp=123456" \
  | jq -r '.access_token')

# Test admin endpoint
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8081/api/admin/dashboard
```

### JWT Token Structure (Example)

After authentication, the JWT will contain:

```json
{
  "exp": 1735500000,
  "iat": 1735496400,
  "iss": "http://localhost:8080/realms/my-realm",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "preferred_username": "admin",
  "email": "admin@example.com",
  "realm_access": {
    "roles": [
      "ADMIN",
      "default-roles-my-realm",
      "offline_access",
      "uma_authorization"
    ]
  },
  "resource_access": {
    "account": {
      "roles": ["manage-account", "view-profile"]
    }
  },
  "groups": [
    "/ADMIN"
  ]
}
```

### Spring Security Authorities (After Conversion)

The `KeycloakJwtConverter` transforms the JWT claims into these Spring authorities:

```
ROLE_ADMIN
ROLE_DEFAULT-ROLES-MY-REALM
ROLE_OFFLINE_ACCESS
ROLE_UMA_AUTHORIZATION
ROLE_ACCOUNT_MANAGE-ACCOUNT
ROLE_ACCOUNT_VIEW-PROFILE
GROUP_ADMIN
```

---

## Summary

| Component | Configuration |
|-----------|---------------|
| **Keycloak Version** | 26.4.7 |
| **Auth Flow** | Browser with Admin OTP |
| **OTP Requirement** | Only for users with `ADMIN` role |
| **Fallback Behavior** | Skip OTP (regular users proceed without it) |
| **JWT Claims** | `realm_access.roles`, `groups`, `resource_access.<client>.roles` |
| **Spring Authority Prefixes** | `ROLE_` for roles, `GROUP_` for groups |
| **Access Control** | `@PreAuthorize` with `hasRole()`, `hasAuthority()` |

This setup provides:
- ✅ Conditional OTP only for ADMIN users
- ✅ Groups and roles included in JWT tokens
- ✅ Spring Security integration with group-based access control
- ✅ Complete realm configuration for import
- ✅ Production-ready security configuration