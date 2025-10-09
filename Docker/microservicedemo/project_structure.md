# Spring Boot OAuth2 with Keycloak - Complete Setup Guide

## 📁 Project Structure

```
spring-keycloak-oauth2/
├── docker-compose.yml
├── setup-keycloak.sh
├── README.md
├── resource-server/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/example/resourceserver/
│           │       ├── ResourceServerApplication.java
│           │       ├── config/
│           │       │   └── SecurityConfig.java
│           │       └── controller/
│           │           └── ApiController.java
│           └── resources/
│               └── application.yml
└── client-app/
    ├── Dockerfile
    ├── pom.xml
    └── src/
        └── main/
            ├── java/
            │   └── com/example/clientapp/
            │       ├── ClientApplication.java
            │       ├── config/
            │       │   └── SecurityConfig.java
            │       ├── controller/
            │       │   └── HomeController.java
            │       └── service/
            │           └── ResourceServerService.java
            └── resources/
                ├── application.yml
                └── templates/
                    ├── index.html
                    ├── home.html
                    └── owner-data.html
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- Docker & Docker Compose
- curl and jq (for setup script)

### Step 1: Create Project Structure

```bash
mkdir -p spring-keycloak-oauth2/resource-server/src/main/java/com/example/resourceserver/{config,controller}
mkdir -p spring-keycloak-oauth2/resource-server/src/main/resources
mkdir -p spring-keycloak-oauth2/client-app/src/main/java/com/example/clientapp/{config,controller,service}
mkdir -p spring-keycloak-oauth2/client-app/src/main/resources/templates

cd spring-keycloak-oauth2
```

### Step 2: Copy All Artifacts

Copy all the provided code files into their respective locations according to the project structure above.

### Step 3: Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 4: Configure Keycloak

Wait for Keycloak to start (about 30 seconds), then run:

```bash
# Run the setup script
./setup-keycloak.sh
```

Or configure manually through the Keycloak Admin Console (see Keycloak Setup Instructions artifact).

### Step 5: Access Applications

- **Keycloak Admin Console**: http://localhost:8080 (admin/admin)
- **Resource Server**: http://localhost:8081
- **Client Application**: http://localhost:8082

## 🔐 Test Credentials

### Owner User (Full Access)
- **Username**: owner
- **Password**: owner123
- **Role**: OWNER
- **Access**: Can access all endpoints including `/api/owner/data`

### Guest User (Limited Access)
- **Username**: guest
- **Password**: guest123
- **Role**: GUEST
- **Access**: Cannot access `/api/owner/data` (will get 403 Forbidden)

## 🧪 Testing the Application

### Test 1: Public Endpoint (No Authentication)
```bash
curl http://localhost:8081/api/public/info
```

### Test 2: Login as Owner
1. Go to http://localhost:8082
2. Click "Login with Keycloak"
3. Enter credentials: owner/owner123
4. You should see the home page with your user info
5. Click "Access Owner Data" - ✅ SUCCESS

### Test 3: Login as Guest
1. Logout and login again
2. Enter credentials: guest/guest123
3. Click "Access Owner Data" - ❌ ACCESS DENIED

### Test 4: API Testing with Token

Get a token:
```bash
TOKEN=$(curl -X POST http://localhost:8080/realms/spring-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=spring-client" \
  -d "client_secret=your-client-secret-here" \
  -d "username=owner" \
  -d "password=owner123" \
  -d "grant_type=password" | jq -r '.access_token')

# Test with token
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/owner/data
```

## 🏗️ Architecture Details

### Components

**1. Keycloak (Authorization Server)**
- Port: 8080
- Manages user authentication
- Issues JWT tokens
- Handles OAuth2/OIDC flows
- Stores users and roles

**2. Resource Server (Microservice)**
- Port: 8081
- Protected REST API
- Validates JWT tokens from Keycloak
- Enforces role-based access control
- Endpoints:
  - `/api/public/info` - No auth required
  - `/api/user/profile` - Authenticated users
  - `/api/owner/data` - Only OWNER role

**3. Client Application**
- Port: 8082
- Web UI for users
- Implements OAuth2 Authorization Code Flow
- Proxies requests to Resource Server
- Automatically includes access tokens

### Security Flow

```
User → Client App → Keycloak → Client App → Resource Server
  1. User clicks "Login"
  2. Redirected to Keycloak login page
  3. User enters credentials
  4. Keycloak validates and issues tokens
  5. Client app receives tokens
  6. Client app makes API calls with token
  7. Resource server validates token
  8. Resource server checks roles
  9. Response returned to client
```

### JWT Token Structure

The access token contains:
```json
{
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "http://localhost:8080/realms/spring-realm",
  "sub": "user-uuid",
  "preferred_username": "owner",
  "email": "owner@example.com",
  "name": "John Owner",
  "roles": ["OWNER"]
}
```

### Role-Based Access Control

**SecurityConfig in Resource Server:**
- Extracts roles from JWT token's "roles" claim
- Adds "ROLE_" prefix for Spring Security
- Maps roles to endpoint permissions
- OWNER role → Can access `/api/owner/**`
- GUEST role → Cannot access `/api/owner/**`

## 🔧 Configuration Details

### Important Configuration Points

**Resource Server (application.yml):**
- `issuer-uri`: Points to Keycloak realm for token validation
- `jwk-set-uri`: Public keys for JWT verification
- Role extraction from "roles" claim in JWT

**Client App (application.yml):**
- `client-id`: Registered client in Keycloak
- `client-secret`: Secret for client authentication
- `redirect-uri`: Where Keycloak redirects after login
- `scope`: Requested scopes (openid, profile, email, roles)

**Docker Profile:**
- Uses container names for inter-service communication
- Keycloak URL changes from localhost to container name

## 🛠️ Troubleshooting

### Services won't start
```bash
# Check if ports are available
netstat -an | grep "8080\|8081\|8082"

# Restart services
docker-compose down
docker-compose up -d
```

### Keycloak setup fails
```bash
# Check Keycloak health
curl http://localhost:8080/health/ready

# View Keycloak logs
docker-compose logs keycloak
```

### Authentication fails
1. Verify client secret matches in:
   - Keycloak client configuration
   - client-app/src/main/resources/application.yml
2. Check redirect URIs are correct
3. Verify realm name is "spring-realm"

### 403 Forbidden errors
- Check user roles in Keycloak Admin Console
- Verify JWT token contains roles claim
- Check SecurityConfig role mappings

## 📚 Additional Resources

- [Spring Security OAuth2](https://spring.io/projects/spring-security-oauth)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth2 RFC](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)

## 🧹 Cleanup

```bash
# Stop and remove all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```
