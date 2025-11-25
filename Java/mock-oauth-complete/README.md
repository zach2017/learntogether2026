# Mock OAuth/OIDC Server & Resource Server

A simple mock OAuth 2.0 and OpenID Connect server that simulates Keycloak functionality for testing purposes.

## Features

- Full OAuth 2.0 / OpenID Connect implementation
- Static user with predefined roles and groups
- JWT token generation with RS256 signing
- JWKS endpoint for token validation
- Resource Server example with role-based access control

## Quick Start

### 1. Start the OAuth Server

```bash
cd mock-oauth-server
mvn spring-boot:run
```

The OAuth server will start on http://localhost:8080

### 2. Start the Resource Server

```bash
cd resource-server
mvn spring-boot:run
```

The Resource Server will start on http://localhost:8081

## Static Credentials

### User Credentials
- **Username:** `testuser`
- **Password:** `password123`

### Client Credentials
- **Client ID:** `test-client`
- **Client Secret:** `test-secret`

### User Roles
- `USER`
- `ADMIN`
- `UPLOAD_ONLY`

### User Groups
- `ADMIN`
- `USER`

## OAuth Server Endpoints

| Endpoint | Description | Method |
|----------|-------------|--------|
| `/.well-known/openid-configuration` | OIDC Discovery | GET |
| `/token` | Token endpoint | POST |
| `/authorize` | Authorization endpoint | GET |
| `/userinfo` | User information | GET |
| `/certs` | JWKS endpoint | GET |
| `/introspect` | Token introspection | POST |
| `/revoke` | Token revocation | POST |
| `/login` | Simple login endpoint | POST |

## Example Usage

### 1. Password Grant Type

```bash
curl -X POST http://localhost:8080/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret"
```

### 2. Client Credentials Grant

```bash
curl -X POST http://localhost:8080/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret"
```

### 3. Authorization Code Flow

```bash
# Step 1: Get authorization code
curl "http://localhost:8080/authorize?response_type=code&client_id=test-client&redirect_uri=http://localhost:3000/callback&scope=openid%20profile%20email"

# Step 2: Exchange code for token
curl -X POST http://localhost:8080/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=<CODE_FROM_STEP_1>" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret"
```

### 4. Simple Login

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 5. Get User Info

```bash
# First get an access token, then:
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8080/userinfo
```

### 6. Refresh Token

```bash
curl -X POST http://localhost:8080/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=<REFRESH_TOKEN>" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret"
```

## Resource Server Endpoints

| Endpoint | Required Role/Group | Description |
|----------|-------------------|-------------|
| `/api/public/health` | None | Health check |
| `/api/user/profile` | USER or ADMIN | User profile |
| `/api/admin/users` | ADMIN | Admin data |
| `/api/upload/file` | UPLOAD_ONLY | Upload endpoint |
| `/api/group/admin-only` | GROUP_ADMIN | Admin group access |
| `/api/scope/profile` | SCOPE_profile | Profile scope access |
| `/api/authenticated` | Any authenticated | General authenticated |

### Testing Resource Server

```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:8080/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret" | jq -r .access_token)

# Test public endpoint (no auth required)
curl http://localhost:8081/api/public/health

# Test user endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/user/profile

# Test admin endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/users

# Test upload endpoint
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/upload/file
```

## Application Configuration

### For Client Applications

Configure your application with these settings:

```yaml
# Spring Boot OAuth2 Client Configuration
spring:
  security:
    oauth2:
      client:
        registration:
          mock-oauth:
            client-id: test-client
            client-secret: test-secret
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - openid
              - profile
              - email
        provider:
          mock-oauth:
            issuer-uri: http://localhost:8080
            authorization-uri: http://localhost:8080/authorize
            token-uri: http://localhost:8080/token
            user-info-uri: http://localhost:8080/userinfo
            jwk-set-uri: http://localhost:8080/certs
```

### For Resource Servers

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080
          jwk-set-uri: http://localhost:8080/certs
```

## Token Structure

The generated JWT tokens include:

### Access Token Claims
```json
{
  "sub": "testuser",
  "iss": "http://localhost:8080",
  "aud": "test-client",
  "exp": 1234567890,
  "iat": 1234567890,
  "preferred_username": "testuser",
  "email": "testuser@example.com",
  "email_verified": true,
  "name": "Test User",
  "given_name": "Test",
  "family_name": "User",
  "realm_access": {
    "roles": ["USER", "ADMIN", "UPLOAD_ONLY"]
  },
  "resource_access": {
    "test-client": {
      "roles": ["USER", "ADMIN", "UPLOAD_ONLY"]
    }
  },
  "groups": ["ADMIN", "USER"],
  "roles": ["USER", "ADMIN", "UPLOAD_ONLY"],
  "scope": "openid profile email"
}
```

### ID Token Claims
```json
{
  "sub": "testuser",
  "iss": "http://localhost:8080",
  "aud": "test-client",
  "exp": 1234567890,
  "iat": 1234567890,
  "auth_time": 1234567890,
  "preferred_username": "testuser",
  "email": "testuser@example.com",
  "email_verified": true,
  "name": "Test User",
  "given_name": "Test",
  "family_name": "User"
}
```

## Security Notes

⚠️ **This is a MOCK server for testing purposes only!**

- Uses static credentials (not secure)
- Accepts any authorization code or refresh token
- No real token revocation
- No persistent storage
- RSA keys are generated on startup (not persistent)

**DO NOT USE IN PRODUCTION!**

## Troubleshooting

### Token Validation Issues
- Ensure the Resource Server can reach the OAuth server's JWKS endpoint
- Check that the `issuer-uri` matches exactly (including protocol and port)
- Verify the token hasn't expired (1 hour validity by default)

### CORS Issues
For browser-based applications, you may need to add CORS configuration to the OAuth server.

### Connection Refused
- Ensure both servers are running on the correct ports
- Check firewall settings if running on different machines

## Testing with Postman

1. Import the endpoints into Postman
2. Set up environment variables:
   - `oauth_server`: `http://localhost:8080`
   - `resource_server`: `http://localhost:8081`
   - `client_id`: `test-client`
   - `client_secret`: `test-secret`
3. Use the OAuth 2.0 authorization type with the configuration above

## License

This is a testing/development tool. Use at your own risk.
