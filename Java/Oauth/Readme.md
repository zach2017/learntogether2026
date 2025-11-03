I'll create a Spring Security configuration with JWT OAuth2 resource server support, along with the necessary controllers.Perfect! I've created a complete Spring Boot application with JWT OAuth2 Resource Server configuration. Here's what I've built for you:

## 📦 Created Files

### Configuration Files
- **[SecurityConfig.java](computer:///mnt/user-data/outputs/SecurityConfig.java)** - Main security configuration with `/ui/**` permitAll and `/api/**` authentication
- **[CustomJwtAuthenticationConverter.java](computer:///mnt/user-data/outputs/CustomJwtAuthenticationConverter.java)** - Converts JWT claims to Spring Security authorities
- **[WebMvcConfig.java](computer:///mnt/user-data/outputs/WebMvcConfig.java)** - Static resource handling configuration

### Controllers
- **[UIController.java](computer:///mnt/user-data/outputs/UIController.java)** - Public UI routes (no authentication required)
- **[ApiController.java](computer:///mnt/user-data/outputs/ApiController.java)** - Protected API routes returning JSON (requires JWT)

### Application Files
- **[DemoApplication.java](computer:///mnt/user-data/outputs/DemoApplication.java)** - Main Spring Boot application class
- **[pom.xml](computer:///mnt/user-data/outputs/pom.xml)** - Maven dependencies including OAuth2 Resource Server
- **[application.properties](computer:///mnt/user-data/outputs/application.properties)** - JWT OAuth2 configuration

### Resources
- **[index.html](computer:///mnt/user-data/outputs/index.html)** - Sample UI page with interactive testing
- **[README.md](computer:///mnt/user-data/outputs/README.md)** - Comprehensive documentation
- **[QUICK_START.md](computer:///mnt/user-data/outputs/QUICK_START.md)** - Quick setup guide

## 🔑 Key Features

**Public Routes (PermitAll):**
- `/ui/**` - All UI routes accessible without authentication
- `/static/**`, `/css/**`, `/js/**`, `/images/**` - Static resources

**Protected Routes (JWT Required):**
- `/api/user` - Get current user info
- `/api/profile` - Get user profile
- `/api/data` - Get protected data
- `/api/submit` - Submit data (POST)

## 🚀 Quick Start

1. Update `application.properties` with your OAuth2 server URL
2. Run: `./mvnw spring-boot:run`
3. Access public UI: `http://localhost:8080/ui`
4. Test protected API with JWT token: 
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT" http://localhost:8080/api/user
   ```

The configuration uses Spring Security 6+ with OAuth2 Resource Server, validates JWTs, and extracts roles from token claims!