# Keycloak Configuration Guide

## Automated Setup Script

Save this as `setup-keycloak.sh`:

```bash
#!/bin/bash

KEYCLOAK_URL="http://localhost:8080"
REALM_NAME="spring-realm"
CLIENT_ID="spring-client"
CLIENT_SECRET="your-client-secret-here"

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to start..."
until curl -sf ${KEYCLOAK_URL}/health/ready > /dev/null; do
    echo "Keycloak is not ready yet..."
    sleep 5
done
echo "Keycloak is ready!"

# Get admin token
echo "Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Create realm
echo "Creating realm: ${REALM_NAME}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'${REALM_NAME}'",
    "enabled": true,
    "sslRequired": "none",
    "registrationAllowed": false,
    "loginWithEmailAllowed": true,
    "duplicateEmailsAllowed": false,
    "resetPasswordAllowed": true,
    "editUsernameAllowed": false,
    "bruteForceProtected": true
  }'

# Create realm roles
echo "Creating roles..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "OWNER", "description": "Owner role with full access"}'

curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "GUEST", "description": "Guest role with limited access"}'

# Create client
echo "Creating client: ${CLIENT_ID}..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'${CLIENT_ID}'",
    "enabled": true,
    "clientAuthenticatorType": "client-secret",
    "secret": "'${CLIENT_SECRET}'",
    "redirectUris": ["http://localhost:8082/*"],
    "webOrigins": ["http://localhost:8082"],
    "protocol": "openid-connect",
    "publicClient": false,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": true,
    "serviceAccountsEnabled": false,
    "fullScopeAllowed": true,
    "attributes": {
      "access.token.lifespan": "300",
      "use.refresh.tokens": "true"
    }
  }'

# Create client scope for roles
echo "Creating client scope for roles..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "roles",
    "protocol": "openid-connect",
    "attributes": {
      "include.in.token.scope": "true",
      "display.on.consent.screen": "true"
    }
  }'

# Get the client scope ID
SCOPE_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="roles") | .id')

# Add role mapper to the scope
echo "Adding role mapper..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes/${SCOPE_ID}/protocol-mappers/models" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "roles",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-usermodel-realm-role-mapper",
    "config": {
      "claim.name": "roles",
      "jsonType.label": "String",
      "multivalued": "true",
      "userinfo.token.claim": "true",
      "id.token.claim": "true",
      "access.token.claim": "true"
    }
  }'

# Create test users
echo "Creating test users..."

# Owner user
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "owner",
    "enabled": true,
    "email": "owner@example.com",
    "firstName": "John",
    "lastName": "Owner",
    "credentials": [{
      "type": "password",
      "value": "owner123",
      "temporary": false
    }]
  }'

# Guest user
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guest",
    "enabled": true,
    "email": "guest@example.com",
    "firstName": "Jane",
    "lastName": "Guest",
    "credentials": [{
      "type": "password",
      "value": "guest123",
      "temporary": false
    }]
  }'

# Get user IDs
OWNER_USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=owner" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

GUEST_USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=guest" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

# Get role IDs
OWNER_ROLE_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/OWNER" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.id')

GUEST_ROLE_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles/GUEST" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.id')

# Assign OWNER role to owner user
echo "Assigning OWNER role to owner user..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${OWNER_USER_ID}/role-mappings/realm" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[{"id": "'${OWNER_ROLE_ID}'", "name": "OWNER"}]'

# Assign GUEST role to guest user
echo "Assigning GUEST role to guest user..."
curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${GUEST_USER_ID}/role-mappings/realm" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[{"id": "'${GUEST_ROLE_ID}'", "name": "GUEST"}]'

echo "✓ Keycloak setup completed!"
echo ""
echo "Test Users:"
echo "  Owner - username: owner, password: owner123 (has OWNER role)"
echo "  Guest - username: guest, password: guest123 (has GUEST role)"
```

Make it executable:
```bash
chmod +x setup-keycloak.sh
```

## Manual Setup Steps

If you prefer manual configuration through Keycloak Admin Console:

### 1. Access Keycloak Admin Console
- URL: http://localhost:8080
- Username: admin
- Password: admin

### 2. Create Realm
1. Click dropdown next to "Master" realm
2. Click "Create Realm"
3. Name: `spring-realm`
4. Click "Create"

### 3. Create Roles
1. Go to "Realm roles" in left menu
2. Click "Create role"
3. Create two roles:
   - **OWNER** (description: "Owner role with full access")
   - **GUEST** (description: "Guest role with limited access")

### 4. Create Client
1. Go to "Clients" in left menu
2. Click "Create client"
3. Client ID: `spring-client`
4. Client authentication: ON
5. Valid redirect URIs: `http://localhost:8082/*`
6. Web origins: `http://localhost:8082`
7. Go to "Credentials" tab
8. Copy the client secret (update in application.yml)

### 5. Configure Client Scopes
1. Go to client "spring-client" → "Client scopes" tab
2. Click "Add client scope"
3. Add "roles" scope
4. Go to "Client scopes" → "roles" → "Mappers"
5. Click "Add mapper" → "By configuration"
6. Select "User Realm Role"
7. Configure:
   - Name: `roles`
   - Token Claim Name: `roles`
   - Add to userinfo: ON
   - Add to ID token: ON
   - Add to access token: ON

### 6. Create Users

**Owner User:**
1. Go to "Users" → "Create new user"
2. Username: `owner`
3. Email: `owner@example.com`
4. First name: `John`
5. Last name: `Owner`
6. Email verified: ON
7. Click "Create"
8. Go to "Credentials" tab → Set password: `owner123`
9. Temporary: OFF
10. Go to "Role mapping" tab → Assign "OWNER" role

**Guest User:**
1. Go to "Users" → "Create new user"
2. Username: `guest`
3. Email: `guest@example.com`
4. First name: `Jane`
5. Last name: `Guest`
6. Email verified: ON
7. Click "Create"
8. Go to "Credentials" tab → Set password: `guest123`
9. Temporary: OFF
10. Go to "Role mapping" tab → Assign "GUEST" role

## Verification

After setup, verify the configuration:

1. Check realm settings: http://localhost:8080/realms/spring-realm/.well-known/openid-configuration
2. Verify both users can login
3. Verify roles are assigned correctly
