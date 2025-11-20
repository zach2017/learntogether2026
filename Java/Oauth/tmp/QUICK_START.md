# Quick Start Guide

## Project Setup

1. **Create the project structure:**

```
spring-security-jwt-demo/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               ├── DemoApplication.java
│   │   │               ├── config/
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   ├── CustomJwtAuthenticationConverter.java
│   │   │               │   └── WebMvcConfig.java
│   │   │               └── controller/
│   │   │                   ├── UIController.java
│   │   │                   └── ApiController.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       │   └── index.html
│   │       └── templates/
│   └── test/
└── pom.xml
```

2. **Place the files:**
   - Copy all `.java` files to their respective packages
   - Copy `pom.xml` to project root
   - Copy `application.properties` to `src/main/resources/`
   - Copy `index.html` to `src/main/resources/static/`

3. **Configure OAuth2 Server:**

Update `application.properties` with your OAuth2 server details:

```properties
# For Keycloak
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/your-realm

# For Auth0
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://your-domain.auth0.com/

# For Okta
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://your-domain.okta.com/oauth2/default
```

## Running the Application

```bash
# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`

## Testing

### 1. Test Public Routes (No Auth Required)

```bash
# Open in browser
http://localhost:8080/ui

# Or using curl
curl http://localhost:8080/ui
```

### 2. Test Protected API (Auth Required)

First, get a JWT token from your OAuth2 server:

```bash
# Example for Keycloak
TOKEN=$(curl -X POST 'http://localhost:8080/realms/your-realm/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'client_id=your-client' \
  -d 'username=user@example.com' \
  -d 'password=password' | jq -r '.access_token')

# Use the token to access protected API
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/user
```

## Expected Behavior

✅ **Public Routes (`/ui/**`):**
- Accessible without authentication
- Returns HTML pages
- No JWT token required

✅ **Protected Routes (`/api/**`):**
- Returns 401 Unauthorized without JWT token
- Returns JSON data with valid JWT token
- Extracts user info from JWT claims

## Troubleshooting

**Issue:** 401 Unauthorized on all endpoints
- Check if issuer-uri is accessible
- Verify JWT token is not expired
- Check token format: `Bearer <token>`

**Issue:** Static resources not loading
- Ensure files are in `src/main/resources/static/`
- Check file paths in HTML

**Issue:** JWT validation fails
- Verify issuer matches between auth server and config
- Check token signature algorithm
- Ensure public key is accessible

## Next Steps

1. Customize JWT claims extraction in `CustomJwtAuthenticationConverter`
2. Add role-based authorization: `@PreAuthorize("hasRole('ADMIN')")`
3. Implement logout functionality
4. Add token refresh mechanism
5. Create custom error handling
6. Add API documentation with Swagger/OpenAPI

## Resources

- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [OAuth2 Resource Server Guide](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/)
- [JWT.io](https://jwt.io/) - JWT token debugger
