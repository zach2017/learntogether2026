# Keycloak Security Best Practices Guide

## OAuth Implementation with React App & Java API

This comprehensive guide covers security best practices for configuring Keycloak to secure a React frontend application and Java API backend using OAuth 2.0 / OpenID Connect.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Initial Setup & SSL/TLS Configuration](#initial-setup--ssltls-configuration)
3. [Realm Configuration](#realm-configuration)
4. [Password Policies](#password-policies)
5. [Session Management](#session-management)
6. [Client Configuration - React App](#client-configuration---react-app)
7. [Client Configuration - Java API](#client-configuration---java-api)
8. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
9. [Security Hardening Checklist](#security-hardening-checklist)
10. [Monitoring & Auditing](#monitoring--auditing)

---

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │ ◄─────► │   Keycloak   │ ◄─────► │   Java API  │
│   Frontend  │  OAuth  │   (IdP)      │  Token  │   Backend   │
│   (Public)  │         │              │  Valid. │   (Conf.)   │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Flow:**
1. React app initiates OAuth flow (Authorization Code with PKCE)
2. Keycloak authenticates user
3. React receives access token
4. React calls Java API with Bearer token
5. Java API validates token with Keycloak

---

## Initial Setup & SSL/TLS Configuration

### Step 1: Enable HTTPS (Required for Production)

**Generate SSL Certificate:**

```bash
# Navigate to Keycloak directory
cd $KEYCLOAK_HOME

# Generate keystore with SSL certificate
keytool -genkeypair -storepass password -storetype PKCS12 \
  -keyalg RSA -keysize 2048 -dname "CN=yourdomain.com" \
  -alias server -ext "SAN:c=DNS:yourdomain.com,IP:YOUR_IP" \
  -keystore conf/server.keystore
```

**Configure Keycloak for HTTPS:**

```bash
# Edit standalone.xml or standalone-ha.xml
vi standalone/configuration/standalone.xml
```

Add HTTPS listener:

```xml
<security-realm name="ApplicationRealm">
    <server-identities>
        <ssl>
            <keystore path="server.keystore" 
                      relative-to="jboss.server.config.dir" 
                      keystore-password="password" 
                      alias="server" 
                      key-password="password"/>
        </ssl>
    </server-identities>
</security-realm>
```

**Start Keycloak with HTTPS:**

```bash
# Keycloak 20+ (Quarkus)
./kc.sh start --https-certificate-file=/path/to/cert.pem \
  --https-certificate-key-file=/path/to/key.pem \
  --hostname=yourdomain.com \
  --https-port=8443

# Or configure in conf/keycloak.conf:
# https-certificate-file=/path/to/cert.pem
# https-certificate-key-file=/path/to/key.pem
# hostname=yourdomain.com
# https-port=8443
```

### Step 2: Disable HTTP (Production)

```bash
# In keycloak.conf
http-enabled=false
https-port=8443
```

---

## Realm Configuration

### Step 1: Create Production Realm

**Via Admin Console:**

1. Login to Keycloak Admin Console: `https://yourdomain.com:8443/admin`
2. Click **"Add Realm"**
3. Name: `production-realm`
4. Enable: **Enabled**
5. Click **Save**

**Via CLI:**

```bash
# Using kcadm.sh
cd $KEYCLOAK_HOME/bin

# Authenticate
./kcadm.sh config credentials --server https://localhost:8443 \
  --realm master --user admin --password admin

# Create realm
./kcadm.sh create realms -s realm=production-realm -s enabled=true
```

### Step 2: Configure Realm Security Settings

**Navigate to:** Realm Settings → Security Defenses

#### Brute Force Detection

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s bruteForceProtected=true \
  -s permanentLockout=false \
  -s maxFailureWaitSeconds=900 \
  -s minimumQuickLoginWaitSeconds=60 \
  -s waitIncrementSeconds=60 \
  -s quickLoginCheckMilliSeconds=1000 \
  -s maxDeltaTimeSeconds=43200 \
  -s failureFactor=5
```

**Via Admin Console:**
1. Go to **Realm Settings → Security Defenses → Brute Force Detection**
2. **Enabled:** ON
3. **Permanent Lockout:** OFF
4. **Max Login Failures:** 5
5. **Wait Increment:** 60 seconds
6. **Max Wait:** 900 seconds (15 minutes)
7. **Failure Reset Time:** 12 hours
8. Click **Save**

#### Headers Configuration

**Navigate to:** Realm Settings → Security Defenses → Headers

```
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-src 'self'; frame-ancestors 'self'; object-src 'none';
X-Content-Type-Options: nosniff
X-Robots-Tag: none
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Via CLI:**

```bash
./kcadm.sh update realms/production-realm \
  -s 'browserSecurityHeaders.xFrameOptions=SAMEORIGIN' \
  -s 'browserSecurityHeaders.contentSecurityPolicy=frame-src '\''self'\''; frame-ancestors '\''self'\''; object-src '\''none'\'';' \
  -s 'browserSecurityHeaders.xContentTypeOptions=nosniff' \
  -s 'browserSecurityHeaders.xRobotsTag=none' \
  -s 'browserSecurityHeaders.xXSSProtection=1; mode=block' \
  -s 'browserSecurityHeaders.strictTransportSecurity=max-age=31536000; includeSubDomains'
```

### Step 3: Token Settings

**Navigate to:** Realm Settings → Tokens

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s accessTokenLifespan=300 \
  -s accessTokenLifespanForImplicitFlow=900 \
  -s ssoSessionIdleTimeout=1800 \
  -s ssoSessionMaxLifespan=36000 \
  -s offlineSessionIdleTimeout=2592000 \
  -s accessCodeLifespan=60 \
  -s accessCodeLifespanUserAction=300 \
  -s accessCodeLifespanLogin=1800
```

**Recommended Values:**
- **Access Token Lifespan:** 5 minutes (300 seconds)
- **Access Token Lifespan For Implicit Flow:** 15 minutes (900 seconds)
- **SSO Session Idle:** 30 minutes (1800 seconds)
- **SSO Session Max:** 10 hours (36000 seconds)
- **Offline Session Idle:** 30 days (2592000 seconds)
- **Client login timeout:** 5 minutes (300 seconds)
- **Login timeout:** 30 minutes (1800 seconds)
- **Login action timeout:** 5 minutes (300 seconds)

---

## Password Policies

### Step 1: Configure Password Policy

**Navigate to:** Realm Settings → Security → Password Policy

**Via Admin Console:**
1. Click **"Add policy"** dropdown
2. Add the following policies:

**Recommended Policies:**

| Policy | Value | Description |
|--------|-------|-------------|
| **Minimum Length** | 12 | At least 12 characters |
| **Maximum Length** | 128 | Prevent extremely long passwords |
| **Uppercase Characters** | 1 | At least 1 uppercase letter |
| **Lowercase Characters** | 1 | At least 1 lowercase letter |
| **Digits** | 1 | At least 1 number |
| **Special Characters** | 1 | At least 1 special character |
| **Not Username** | - | Password cannot contain username |
| **Not Email** | - | Password cannot contain email |
| **Password History** | 5 | Cannot reuse last 5 passwords |
| **Expire Password** | 90 days | Force password change every 90 days |
| **Password Blacklist** | /path/to/blacklist.txt | Block common passwords |

**Via CLI:**

```bash
./kcadm.sh update realms/production-realm \
  -s 'passwordPolicy=length(12) and maxLength(128) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername and notEmail and passwordHistory(5) and expirePassword(90) and passwordBlacklist(/path/to/blacklist.txt)'
```

### Step 2: Configure OTP Policy (Two-Factor Authentication)

**Navigate to:** Authentication → OTP Policy

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s 'otpPolicyType=totp' \
  -s 'otpPolicyAlgorithm=HmacSHA256' \
  -s 'otpPolicyDigits=6' \
  -s 'otpPolicyPeriod=30' \
  -s 'otpPolicyInitialCounter=0' \
  -s 'otpPolicyLookAheadWindow=1'
```

**Recommended Settings:**
- **OTP Type:** Time-Based (TOTP)
- **OTP Hash Algorithm:** SHA256
- **Number of Digits:** 6
- **Look Ahead Window:** 1
- **OTP Token Period:** 30 seconds

### Step 3: Enable Required Actions

**Navigate to:** Authentication → Required Actions

Enable the following:
- ✅ **Configure OTP** (for 2FA setup)
- ✅ **Update Password** (for password expiration)
- ✅ **Update Profile**
- ✅ **Verify Email**

```bash
# Via CLI - Set required actions as default
./kcadm.sh update realms/production-realm \
  -s 'requiredActions=[{"alias":"CONFIGURE_TOTP","name":"Configure OTP","enabled":true,"defaultAction":false},{"alias":"UPDATE_PASSWORD","name":"Update Password","enabled":true,"defaultAction":false},{"alias":"UPDATE_PROFILE","name":"Update Profile","enabled":true,"defaultAction":false},{"alias":"VERIFY_EMAIL","name":"Verify Email","enabled":true,"defaultAction":true}]'
```

---

## Session Management

### Step 1: Configure Session Timeouts

**Navigate to:** Realm Settings → Tokens (tab)

**Security-Focused Settings:**

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s ssoSessionIdleTimeout=1800 \
  -s ssoSessionMaxLifespan=36000 \
  -s ssoSessionIdleTimeoutRememberMe=0 \
  -s ssoSessionMaxLifespanRememberMe=0 \
  -s offlineSessionIdleTimeout=2592000 \
  -s offlineSessionMaxLifespan=5184000
```

**Settings Explanation:**

| Setting | Value | Description |
|---------|-------|-------------|
| **SSO Session Idle** | 30 min | Logout after 30 min of inactivity |
| **SSO Session Max** | 10 hours | Force re-login after 10 hours |
| **Remember Me Idle** | Disabled (0) | Don't extend sessions with "Remember Me" |
| **Remember Me Max** | Disabled (0) | Security best practice |
| **Offline Session Idle** | 30 days | For refresh tokens when offline |
| **Offline Session Max** | 60 days | Maximum offline session duration |

### Step 2: Revocation Settings

**Navigate to:** Realm Settings → Tokens → Revoke Refresh Token

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s revokeRefreshToken=true \
  -s refreshTokenMaxReuse=0
```

**Enable:**
- ✅ **Revoke Refresh Token:** Enabled (prevents refresh token reuse)
- **Refresh Token Max Reuse:** 0 (one-time use only)

### Step 3: Configure User Session Limits

**Via Admin Console:**
1. Go to **Realm Settings → Sessions**
2. Review active sessions
3. Set up session monitoring

**Via CLI - List Active Sessions:**

```bash
# Get session stats
./kcadm.sh get client-session-stats -r production-realm
```

---

## Client Configuration - React App

### Step 1: Create React Client

**Via Admin Console:**

1. Navigate to **Clients → Create**
2. **Client ID:** `react-app`
3. **Client Protocol:** `openid-connect`
4. Click **Save**

**Via CLI:**

```bash
./kcadm.sh create clients -r production-realm \
  -s clientId=react-app \
  -s enabled=true \
  -s protocol=openid-connect \
  -s publicClient=true \
  -s standardFlowEnabled=true \
  -s implicitFlowEnabled=false \
  -s directAccessGrantsEnabled=false \
  -s serviceAccountsEnabled=false
```

### Step 2: Configure React Client Settings

**Settings Tab:**

| Setting | Value | Justification |
|---------|-------|---------------|
| **Access Type** | Public | React is a public client (no secret storage) |
| **Standard Flow Enabled** | ON | Authorization Code Flow |
| **Implicit Flow Enabled** | OFF | **SECURITY: Deprecated, use PKCE** |
| **Direct Access Grants** | OFF | **SECURITY: No password grant** |
| **Service Accounts Enabled** | OFF | Not needed for frontend |
| **Authorization Enabled** | OFF | Not needed for frontend |

**Via CLI:**

```bash
./kcadm.sh update clients/react-app -r production-realm \
  -s publicClient=true \
  -s standardFlowEnabled=true \
  -s implicitFlowEnabled=false \
  -s directAccessGrantsEnabled=false \
  -s serviceAccountsEnabled=false
```

### Step 3: Configure Valid Redirect URIs

**CRITICAL SECURITY:** Only add trusted URIs!

```bash
# Via CLI
./kcadm.sh update clients/react-app -r production-realm \
  -s 'redirectUris=["https://yourdomain.com/*","https://yourdomain.com:3000/*"]' \
  -s 'webOrigins=["https://yourdomain.com","https://yourdomain.com:3000"]' \
  -s baseUrl=https://yourdomain.com
```

**Via Admin Console:**
1. Go to **Clients → react-app → Settings**
2. **Valid Redirect URIs:** 
   - `https://yourdomain.com/*`
   - `https://yourdomain.com:3000/*` (development)
3. **Valid Post Logout Redirect URIs:**
   - `https://yourdomain.com/*`
4. **Web Origins:**
   - `https://yourdomain.com`
   - `https://yourdomain.com:3000`
5. **Base URL:** `https://yourdomain.com`

⚠️ **NEVER use `*` wildcard in production!**

### Step 4: Advanced Settings - Security

**Navigate to:** Clients → react-app → Advanced Settings

```bash
# Via CLI
./kcadm.sh update clients/react-app -r production-realm \
  -s 'attributes.pkce.code.challenge.method=S256' \
  -s 'attributes.access.token.lifespan=300' \
  -s 'attributes.client.session.idle.timeout=1800' \
  -s 'attributes.client.session.max.lifespan=36000' \
  -s 'attributes.client.offline.session.idle.timeout=2592000' \
  -s 'attributes.client.offline.session.max.lifespan=5184000'
```

**Settings:**
- **PKCE Code Challenge Method:** S256 (required for public clients)
- **Access Token Lifespan:** 300 seconds (5 minutes)
- **Client Session Idle:** 1800 seconds (30 minutes)
- **Client Session Max:** 36000 seconds (10 hours)

### Step 5: OAuth Scopes

**Navigate to:** Clients → react-app → Client Scopes

**Default Client Scopes** (automatically included):
- ✅ `email`
- ✅ `profile`
- ✅ `roles`
- ✅ `web-origins`

**Optional Client Scopes** (request when needed):
- `address`
- `phone`
- `offline_access` (for refresh tokens)

---

## Client Configuration - Java API

### Step 1: Create Java API Client

**Via CLI:**

```bash
./kcadm.sh create clients -r production-realm \
  -s clientId=java-api \
  -s enabled=true \
  -s protocol=openid-connect \
  -s publicClient=false \
  -s bearerOnly=true \
  -s standardFlowEnabled=false \
  -s implicitFlowEnabled=false \
  -s directAccessGrantsEnabled=false \
  -s serviceAccountsEnabled=false
```

**Via Admin Console:**

1. Navigate to **Clients → Create**
2. **Client ID:** `java-api`
3. **Client Protocol:** `openid-connect`
4. Click **Save**

### Step 2: Configure Java API Settings

**Settings Tab:**

| Setting | Value | Justification |
|---------|-------|---------------|
| **Access Type** | Bearer-only | API only validates tokens |
| **Standard Flow Enabled** | OFF | API doesn't authenticate users |
| **Implicit Flow Enabled** | OFF | Not needed |
| **Direct Access Grants** | OFF | Not needed |
| **Service Accounts Enabled** | OFF | Unless API needs to call other services |

**Via CLI:**

```bash
./kcadm.sh update clients/java-api -r production-realm \
  -s publicClient=false \
  -s bearerOnly=true \
  -s standardFlowEnabled=false \
  -s implicitFlowEnabled=false \
  -s directAccessGrantsEnabled=false
```

### Step 3: Configure Valid Redirect URIs (Optional)

For Bearer-only clients, this is typically not needed. But if your API has admin endpoints:

```bash
./kcadm.sh update clients/java-api -r production-realm \
  -s 'redirectUris=["https://api.yourdomain.com/*"]' \
  -s baseUrl=https://api.yourdomain.com
```

### Step 4: Service Account (Optional - If API calls other services)

If your Java API needs to authenticate as itself:

```bash
# Enable service account
./kcadm.sh update clients/java-api -r production-realm \
  -s serviceAccountsEnabled=true \
  -s publicClient=false

# Generate and retrieve client secret
SECRET=$(./kcadm.sh get clients/java-api/client-secret -r production-realm --fields value --format csv --noquotes)
echo "Client Secret: $SECRET"
```

**Store the secret securely** (environment variable, secrets manager, not in code!)

---

## Role-Based Access Control (RBAC)

### Step 1: Create Realm Roles

**Via CLI:**

```bash
# Create roles
./kcadm.sh create roles -r production-realm -s name=admin -s description="Administrator role"
./kcadm.sh create roles -r production-realm -s name=user -s description="Standard user role"
./kcadm.sh create roles -r production-realm -s name=api_read -s description="API read access"
./kcadm.sh create roles -r production-realm -s name=api_write -s description="API write access"
```

**Via Admin Console:**

1. Navigate to **Realm Roles → Add Role**
2. Create the following roles:
   - `admin` - Full administrative access
   - `user` - Standard user access
   - `api_read` - Read-only API access
   - `api_write` - Write API access
   - `api_delete` - Delete API access

### Step 2: Create Composite Roles

**Example: Create a power_user role that includes multiple permissions**

```bash
# Create composite role
./kcadm.sh create roles -r production-realm -s name=power_user -s description="Power user with read and write"

# Add child roles to composite
./kcadm.sh add-roles -r production-realm --rname power_user --rolename api_read --rolename api_write
```

### Step 3: Assign Default Roles

**Set default roles for new users:**

```bash
# Via CLI
./kcadm.sh update realms/production-realm \
  -s 'defaultRoles=["user","offline_access","uma_authorization"]'
```

**Via Admin Console:**
1. Navigate to **Realm Settings → User Registration → Default Roles**
2. Add `user` role
3. Click **Save**

### Step 4: Create Client Roles (Fine-grained permissions)

**For Java API Client:**

```bash
# Create client roles
./kcadm.sh create clients/java-api/roles -r production-realm -s name=resource:read -s description="Read resources"
./kcadm.sh create clients/java-api/roles -r production-realm -s name=resource:write -s description="Write resources"
./kcadm.sh create clients/java-api/roles -r production-realm -s name=resource:delete -s description="Delete resources"
```

### Step 5: Assign Roles to Users

**Via CLI:**

```bash
# Get user ID
USER_ID=$(./kcadm.sh get users -r production-realm -q username=john.doe --fields id --format csv --noquotes)

# Assign realm roles
./kcadm.sh add-roles -r production-realm --uid $USER_ID --rolename user --rolename api_read

# Assign client roles
./kcadm.sh add-roles -r production-realm --uid $USER_ID --cclientid java-api --rolename resource:read --rolename resource:write
```

**Via Admin Console:**
1. Navigate to **Users → [Select User] → Role Mappings**
2. Select roles from **Available Roles**
3. Click **Add selected**

### Step 6: Configure Role Mappers

**Add roles to tokens:**

**Via Admin Console:**
1. Go to **Clients → react-app → Mappers → Create**
2. **Name:** `realm-roles`
3. **Mapper Type:** `User Realm Role`
4. **Token Claim Name:** `realm_roles`
5. **Claim JSON Type:** `String`
6. **Add to ID token:** ON
7. **Add to access token:** ON
8. **Add to userinfo:** ON
9. Click **Save**

**Via CLI:**

```bash
./kcadm.sh create clients/react-app/protocol-mappers/models -r production-realm \
  -s name=realm-roles \
  -s protocol=openid-connect \
  -s protocolMapper=oidc-usermodel-realm-role-mapper \
  -s 'config."claim.name"=realm_roles' \
  -s 'config."access.token.claim"=true' \
  -s 'config."id.token.claim"=true' \
  -s 'config."userinfo.token.claim"=true'
```

---

## Security Hardening Checklist

### Realm-Level Security

- [ ] **SSL/TLS Enabled** - All traffic over HTTPS
- [ ] **HTTP Disabled** - No plain HTTP in production
- [ ] **Strong Password Policy** - Min 12 chars, complexity requirements
- [ ] **Brute Force Protection** - Max 5 failed attempts
- [ ] **Email Verification** - Required action for new users
- [ ] **OTP/2FA Available** - TOTP configured and encouraged
- [ ] **Short Token Lifespans** - Access tokens ≤ 5 minutes
- [ ] **Session Timeouts** - Idle timeout ≤ 30 minutes
- [ ] **Refresh Token Rotation** - One-time use only
- [ ] **Security Headers** - All recommended headers configured
- [ ] **Content Security Policy** - Restrictive CSP headers

### Client-Level Security (React App)

- [ ] **Public Client** - Correct client type
- [ ] **PKCE Enabled** - S256 code challenge
- [ ] **Authorization Code Flow** - Standard flow only
- [ ] **Implicit Flow Disabled** - Deprecated and insecure
- [ ] **Direct Grants Disabled** - No Resource Owner Password flow
- [ ] **Specific Redirect URIs** - No wildcards in production
- [ ] **CORS Configured** - Specific web origins only
- [ ] **Logout Endpoints** - Valid post-logout redirects

### Client-Level Security (Java API)

- [ ] **Bearer-Only** - Correct client type for API
- [ ] **All Flows Disabled** - API only validates tokens
- [ ] **Audience Checking** - Validate intended audience
- [ ] **Issuer Validation** - Verify token issuer
- [ ] **Signature Verification** - Verify JWT signature
- [ ] **Expiration Checking** - Reject expired tokens
- [ ] **Scope Validation** - Check required scopes

### RBAC & Authorization

- [ ] **Least Privilege** - Default roles are minimal
- [ ] **Role Hierarchy** - Use composite roles appropriately
- [ ] **Client Roles** - Fine-grained permissions defined
- [ ] **Role Mappers** - Roles included in tokens
- [ ] **No Default Admin** - Remove default admin accounts

### Operational Security

- [ ] **Admin Console Access** - Restricted IP ranges
- [ ] **Audit Logging** - Events logged and monitored
- [ ] **Regular Backups** - Database and config backed up
- [ ] **Secret Management** - Secrets in vault, not code
- [ ] **Update Policy** - Regular Keycloak updates
- [ ] **Network Segmentation** - Keycloak in private network
- [ ] **Database Security** - DB credentials secured, encrypted at rest

---

## Monitoring & Auditing

### Step 1: Enable Event Logging

**Navigate to:** Realm Settings → Events

**Via Admin Console:**

**Login Events Tab:**
- **Save Events:** ON
- **Expiration:** 7 days (or longer for compliance)
- **Include Representation:** OFF (reduces log size)

**Enable Event Listeners:**
- ✅ `jboss-logging` (logs to server logs)

**Admin Events Tab:**
- **Save Admin Events:** ON
- **Include Representation:** ON (for audit trail)

**Via CLI:**

```bash
./kcadm.sh update events/config -r production-realm \
  -s eventsEnabled=true \
  -s eventsExpiration=604800 \
  -s 'eventsListeners=["jboss-logging"]' \
  -s adminEventsEnabled=true \
  -s adminEventsDetailsEnabled=true
```

### Step 2: Monitor Critical Events

**Events to Monitor:**

**Security Events:**
- `LOGIN_ERROR` - Failed login attempts
- `USER_DISABLED_BY_PERMANENT_LOCKOUT` - Account locked
- `UPDATE_PASSWORD` - Password changes
- `REMOVE_TOTP` - 2FA removal
- `UPDATE_EMAIL` - Email changes
- `IMPERSONATE` - Admin impersonation

**Admin Events:**
- User creation/deletion
- Role assignments
- Client configuration changes
- Realm setting modifications

### Step 3: Export Events for SIEM Integration

```bash
# Query events via Admin REST API
./kcadm.sh get events -r production-realm --offset 0 --limit 100

# Query admin events
./kcadm.sh get admin-events -r production-realm --offset 0 --limit 100
```

### Step 4: Configure Alerts

Set up monitoring for:
- Multiple failed login attempts from same IP
- Successful login from new location/device
- Admin actions outside business hours
- Mass role assignments
- Client configuration changes
- SSL certificate expiration warnings

---

## Integration Examples

### React App Integration (with PKCE)

**Install Keycloak JS adapter:**

```bash
npm install keycloak-js
```

**Initialize Keycloak:**

```javascript
// keycloak.js
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://yourdomain.com:8443',
  realm: 'production-realm',
  clientId: 'react-app',
});

export default keycloak;
```

**App.js:**

```javascript
import { useEffect, useState } from 'react';
import keycloak from './keycloak';

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: true,
      pkceMethod: 'S256', // CRITICAL: Enable PKCE
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
    }).then(auth => {
      setAuthenticated(auth);
      
      // Token refresh
      setInterval(() => {
        keycloak.updateToken(70).then(refreshed => {
          if (refreshed) {
            console.log('Token refreshed');
          }
        }).catch(() => {
          console.error('Failed to refresh token');
        });
      }, 60000); // Check every minute
      
    }).catch(err => {
      console.error('Authentication failed', err);
    });
  }, []);

  if (!authenticated) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {keycloak.tokenParsed.preferred_username}</h1>
      <button onClick={() => keycloak.logout()}>Logout</button>
    </div>
  );
}

export default App;
```

**Make API calls with token:**

```javascript
// api.js
import keycloak from './keycloak';

export const callAPI = async (endpoint) => {
  const token = keycloak.token;
  
  const response = await fetch(`https://api.yourdomain.com${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

### Java API Integration (Spring Boot)

**Add dependencies (pom.xml):**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

**application.yml:**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://yourdomain.com:8443/realms/production-realm
          jwk-set-uri: https://yourdomain.com:8443/realms/production-realm/protocol/openid-connect/certs

server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: changeit
    key-store-type: PKCS12
```

**Security Configuration:**

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("admin")
                .requestMatchers(HttpMethod.GET, "/api/resources/**").hasAnyRole("user", "api_read")
                .requestMatchers(HttpMethod.POST, "/api/resources/**").hasRole("api_write")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasRole("api_delete")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable()); // Disabled for stateless API

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }
}
```

**Role Converter:**

```java
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
    
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        
        // Extract realm roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            roles.forEach(role -> authorities.add(new SimpleGrantedAuthority("ROLE_" + role)));
        }
        
        // Extract resource (client) roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            resourceAccess.forEach((resource, access) -> {
                Map<String, Object> accessMap = (Map<String, Object>) access;
                if (accessMap.containsKey("roles")) {
                    List<String> roles = (List<String>) accessMap.get("roles");
                    roles.forEach(role -> 
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                }
            });
        }
        
        return authorities;
    }
}
```

**Controller Example:**

```java
@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('user', 'api_read')")
    public ResponseEntity<List<Resource>> getResources(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        // Business logic
        return ResponseEntity.ok(resources);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('api_write')")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        // Business logic
        return ResponseEntity.status(HttpStatus.CREATED).body(resource);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('api_delete')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        // Business logic
        return ResponseEntity.noContent().build();
    }
}
```

---

## Additional Security Recommendations

### 1. Rate Limiting

Implement rate limiting at:
- **Reverse proxy level** (nginx, Apache)
- **Application level** (Spring Security)
- **Keycloak level** (brute force protection)

### 2. IP Whitelisting

For admin console:

```bash
# Configure in standalone.xml
<http-interface security-realm="ManagementRealm">
    <http-upgrade enabled="true"/>
    <socket-binding http="management-http"/>
    <allowed-origins>
        <origin>https://admin.yourdomain.com</origin>
    </allowed-origins>
</http-interface>
```

### 3. Database Encryption

Encrypt sensitive data at rest:

```bash
# PostgreSQL example
ALTER TABLE user_entity ALTER COLUMN email TYPE TEXT;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

# Encrypt existing data
UPDATE user_entity 
SET email = pgp_sym_encrypt(email, 'encryption-key');
```

### 4. Regular Security Audits

- Weekly: Review failed login attempts
- Monthly: Audit user roles and permissions
- Quarterly: Full security assessment
- Annually: Penetration testing

### 5. Backup Strategy

```bash
# Backup Keycloak database
pg_dump keycloak_db > keycloak_backup_$(date +%Y%m%d).sql

# Backup Keycloak configuration
tar -czf keycloak_config_$(date +%Y%m%d).tar.gz $KEYCLOAK_HOME/standalone/configuration/
```

---

## Compliance Considerations

### GDPR Compliance

- **Data Minimization:** Only collect necessary user data
- **Right to be Forgotten:** Implement user deletion workflow
- **Data Export:** Provide user data export functionality
- **Consent Management:** Track and manage user consents
- **Privacy Policy:** Link privacy policy in registration

### HIPAA Compliance (if applicable)

- **Audit Trails:** Enable comprehensive logging
- **Access Controls:** Strict RBAC implementation
- **Encryption:** Encrypt data in transit and at rest
- **Session Management:** Auto-logout after inactivity
- **BAA Required:** Ensure Keycloak hosting meets HIPAA requirements

---

## Troubleshooting

### Common Issues

**1. CORS Errors**

```javascript
// Ensure Web Origins is configured in React client
Valid Web Origins: https://yourdomain.com
```

**2. Token Expiration**

```javascript
// Implement token refresh in React
useEffect(() => {
  const interval = setInterval(() => {
    keycloak.updateToken(70);
  }, 60000);
  return () => clearInterval(interval);
}, []);
```

**3. Invalid Redirect URI**

```bash
# Verify exact match in client configuration
Valid Redirect URIs must exactly match callback URL
```

**4. SSL Certificate Errors**

```bash
# For development, trust self-signed cert
keytool -import -trustcacerts -alias keycloak -file cert.pem -keystore $JAVA_HOME/lib/security/cacerts
```

---

## Quick Reference Commands

```bash
# Start Keycloak
./kc.sh start --optimized

# Create realm
./kcadm.sh create realms -s realm=my-realm -s enabled=true

# Create user
./kcadm.sh create users -r my-realm -s username=john -s enabled=true

# Set password
./kcadm.sh set-password -r my-realm --username john --new-password password123

# Assign role
./kcadm.sh add-roles -r my-realm --uusername john --rolename user

# Export realm
./kc.sh export --dir /tmp/export --realm my-realm

# Import realm
./kc.sh import --dir /tmp/export --override true

# View logs
tail -f standalone/log/server.log
```

---

## Conclusion

This guide provides a comprehensive security foundation for Keycloak with OAuth 2.0, React, and Java API integration. Security is an ongoing process - regularly review and update configurations as threats evolve.

**Remember:**
- ✅ Always use HTTPS in production
- ✅ Implement PKCE for public clients
- ✅ Use short-lived access tokens
- ✅ Enable brute force protection
- ✅ Enforce strong password policies
- ✅ Implement least privilege access
- ✅ Enable comprehensive logging
- ✅ Regular security audits

For additional support, visit:
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Security Guide](https://www.keycloak.org/docs/latest/server_admin/#_security)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Author:** Security Best Practices Team
