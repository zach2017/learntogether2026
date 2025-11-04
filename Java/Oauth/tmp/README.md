# Spring Security JWT OAuth2 Resource Server

This project demonstrates a Spring Boot application with JWT OAuth2 resource server configuration.

## Features

- ✅ Public `/ui/**` routes for static content (no authentication required)
- ✅ Protected `/api/**` routes requiring JWT authentication
- ✅ OAuth2 Resource Server with JWT token validation
- ✅ Static resource serving (CSS, JS, images)
- ✅ RESTful API endpoints returning JSON

## Project Structure

```
src/main/java/com/example/demo/
├── config/
│   ├── SecurityConfig.java                    # Main security configuration
│   ├── CustomJwtAuthenticationConverter.java  # JWT claims to authorities converter
│   └── WebMvcConfig.java                      # Static resource configuration
├── controller/
│   ├── UIController.java                      # UI routes (permitAll)
│   └── ApiController.java                     # API routes (authenticated)
└── DemoApplication.java                       # Main application class

src/main/resources/
├── application.properties                     # Application configuration
├── static/                                    # Static resources (CSS, JS, images)
└── templates/                                 # HTML templates
```

## Configuration

### 1. Update `application.properties`

Configure your OAuth2 authorization server:

```properties
# Using issuer-uri (recommended)
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://your-auth-server.com/realms/your-realm

# OR using JWK Set URI
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://your-auth-server.com/.well-known/jwks.json
```

### 2. JWT Token Structure

The application expects JWT tokens with the following claims:

```json
{
  "sub": "user@example.com",
  "email": "user@example.com",
  "roles": ["USER", "ADMIN"],
  "realm_access": {
    "roles": ["USER", "ADMIN"]
  }
}
```

## API Endpoints

### Public Endpoints (No Authentication)

- `GET /ui` - Main UI page
- `GET /ui/home` - Home page
- `GET /ui/about` - About page
- `GET /ui/dashboard` - Dashboard page
- `GET /static/**` - Static resources

### Protected Endpoints (Requires JWT)

- `GET /api/user` - Get current user information
- `GET /api/profile` - Get user profile
- `GET /api/data` - Get protected data
- `POST /api/submit` - Submit data
- `GET /api/health` - Health check

## Usage Examples

### 1. Access Public UI (No Token Required)

```bash
curl http://localhost:8080/ui
```

### 2. Access Protected API (Requires JWT Token)

```bash
# Get user information
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/user

# Get data
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/data

# Submit data
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"John","value":"123"}' \
     http://localhost:8080/api/submit
```

## Obtaining JWT Tokens

### Option 1: Using Keycloak

```bash
curl -X POST 'http://localhost:8080/realms/your-realm/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'client_id=your-client' \
  -d 'client_secret=your-secret' \
  -d 'username=user@example.com' \
  -d 'password=password'
```

### Option 2: Using Auth0

```bash
curl -X POST 'https://your-domain.auth0.com/oauth/token' \
  -H 'Content-Type: application/json' \
  -d '{
    "grant_type": "password",
    "username": "user@example.com",
    "password": "password",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "audience": "your-api-audience"
  }'
```

## Security Configuration Details

### SecurityConfig.java

- Permits all access to `/ui/**` and static resources
- Requires authentication for `/api/**` endpoints
- Configures OAuth2 Resource Server with JWT support
- Uses stateless session management
- Includes CORS configuration

### CustomJwtAuthenticationConverter.java

- Extracts roles from JWT claims
- Converts JWT claims to Spring Security authorities
- Supports multiple JWT claim structures (roles, realm_access)

## Running the Application

```bash
# Using Maven
./mvnw spring-boot:run

# Using Java
./mvnw clean package
java -jar target/spring-security-jwt-demo-0.0.1-SNAPSHOT.jar
```

## Testing

### Test Public Endpoints

```bash
# Should return 200 OK
curl -v http://localhost:8080/ui
```

### Test Protected Endpoints Without Token

```bash
# Should return 401 Unauthorized
curl -v http://localhost:8080/api/user
```

### Test Protected Endpoints With Token

```bash
# Should return 200 OK with user data
curl -v -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/user
```

## Common Issues

### 1. "Invalid JWT token"

- Verify the issuer-uri is correct
- Check that the JWT token is not expired
- Ensure the token signature is valid

### 2. "403 Forbidden"

- Verify the user has the required roles/authorities
- Check the JWT claims structure matches the converter

### 3. Static resources not loading

- Ensure files are in `src/main/resources/static/`
- Check the resource handler mappings in WebMvcConfig

## Dependencies

- Spring Boot 3.2.0
- Spring Security
- Spring OAuth2 Resource Server
- Thymeleaf (optional, for UI templates)

## License

MIT License
