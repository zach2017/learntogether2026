## Detailed Application Overview

I've created a complete Spring Boot OAuth2 system secured by Keycloak with the following components:

### **🏗️ Architecture**

**Three main services:**
1. **Keycloak** (Port 8080) - Authorization server managing authentication and issuing JWT tokens
2. **Resource Server** (Port 8081) - Protected microservice with REST API
3. **Client Application** (Port 8082) - Web UI that consumes the microservice

### **🔐 Security Implementation**

**Role-Based Access Control:**
- **OWNER role** ✅ - Full access to all endpoints including `/api/owner/data`
- **GUEST role** ❌ - Blocked from accessing `/api/owner/data` (returns 403 Forbidden)

**OAuth2 Flow:**
- Uses Authorization Code Flow with PKCE
- Client app redirects users to Keycloak for login
- Keycloak issues JWT access tokens
- Client automatically includes tokens when calling the resource server
- Resource server validates tokens and checks roles

### **📦 What's Included**

**Resource Server Features:**
- JWT token validation with Keycloak
- Role extraction from token claims
- Three endpoints with different security levels:
  - Public endpoint (no auth)
  - User profile (authenticated)
  - Owner data (OWNER role only)

**Client Application Features:**
- Thymeleaf web interface
- OAuth2 login integration
- Automatic token management
- WebClient for calling resource server
- Role-based UI elements

**Docker Setup:**
- Multi-stage builds for both apps
- Health checks for Keycloak
- Network isolation
- Environment-specific profiles

### **🚀 How to Use**

1. Copy all artifacts to your project structure
2. Run `docker-compose up -d`
3. Execute `./setup-keycloak.sh` to configure Keycloak
4. Access http://localhost:8082 and test with:
   - **owner/owner123** (can access everything)
   - **guest/guest123** (blocked from owner endpoints)

The setup script automatically creates the realm, roles, client, and test users. You'll see the GUEST user get denied when trying to access owner-only resources!