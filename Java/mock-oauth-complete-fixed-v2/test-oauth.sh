#!/bin/bash

# Test script for Mock OAuth Server
# Make sure the OAuth server is running on port 8080 before running this script

echo "==========================================";
echo "Testing Mock OAuth Server"
echo "==========================================";
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URLs
OAUTH_SERVER="http://localhost:8080"
RESOURCE_SERVER="http://localhost:8081"

echo "1. Testing OIDC Discovery Endpoint"
echo "-----------------------------------"
curl -s "${OAUTH_SERVER}/.well-known/openid-configuration" | jq '.' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Discovery endpoint working${NC}"
else
    echo -e "${RED}✗ Discovery endpoint failed${NC}"
fi
echo

echo "2. Testing Password Grant"
echo "--------------------------"
RESPONSE=$(curl -s -X POST "${OAUTH_SERVER}/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret")

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token' 2>/dev/null)
if [ "$ACCESS_TOKEN" != "null" ] && [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Password grant successful${NC}"
    echo "  Access token: ${ACCESS_TOKEN:0:50}..."
else
    echo -e "${RED}✗ Password grant failed${NC}"
fi
echo

echo "3. Testing Client Credentials Grant"
echo "------------------------------------"
RESPONSE=$(curl -s -X POST "${OAUTH_SERVER}/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret")

CC_TOKEN=$(echo $RESPONSE | jq -r '.access_token' 2>/dev/null)
if [ "$CC_TOKEN" != "null" ] && [ ! -z "$CC_TOKEN" ]; then
    echo -e "${GREEN}✓ Client credentials grant successful${NC}"
else
    echo -e "${RED}✗ Client credentials grant failed${NC}"
fi
echo

echo "4. Testing UserInfo Endpoint"
echo "-----------------------------"
if [ ! -z "$ACCESS_TOKEN" ]; then
    USER_INFO=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
      "${OAUTH_SERVER}/userinfo")
    
    USERNAME=$(echo $USER_INFO | jq -r '.preferred_username' 2>/dev/null)
    if [ "$USERNAME" = "testuser" ]; then
        echo -e "${GREEN}✓ UserInfo endpoint working${NC}"
        echo "  Username: $USERNAME"
        echo "  Roles: $(echo $USER_INFO | jq -c '.roles' 2>/dev/null)"
        echo "  Groups: $(echo $USER_INFO | jq -c '.groups' 2>/dev/null)"
    else
        echo -e "${RED}✗ UserInfo endpoint failed${NC}"
    fi
else
    echo -e "${RED}✗ Skipping - No access token${NC}"
fi
echo

echo "5. Testing JWKS Endpoint"
echo "------------------------"
JWKS=$(curl -s "${OAUTH_SERVER}/certs")
KEYS=$(echo $JWKS | jq '.keys | length' 2>/dev/null)
if [ "$KEYS" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ JWKS endpoint working${NC}"
    echo "  Number of keys: $KEYS"
else
    echo -e "${RED}✗ JWKS endpoint failed${NC}"
fi
echo

echo "6. Testing Simple Login Endpoint"
echo "---------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${OAUTH_SERVER}/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}')

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token' 2>/dev/null)
if [ "$LOGIN_TOKEN" != "null" ] && [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Login endpoint successful${NC}"
    USER_ROLES=$(echo $LOGIN_RESPONSE | jq -c '.user.roles' 2>/dev/null)
    echo "  User roles: $USER_ROLES"
else
    echo -e "${RED}✗ Login endpoint failed${NC}"
fi
echo

echo "7. Testing Token Introspection"
echo "-------------------------------"
if [ ! -z "$ACCESS_TOKEN" ]; then
    INTROSPECT=$(curl -s -X POST "${OAUTH_SERVER}/introspect" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "token=$ACCESS_TOKEN")
    
    ACTIVE=$(echo $INTROSPECT | jq -r '.active' 2>/dev/null)
    if [ "$ACTIVE" = "true" ]; then
        echo -e "${GREEN}✓ Token introspection working${NC}"
        echo "  Token is active: $ACTIVE"
    else
        echo -e "${RED}✗ Token introspection failed${NC}"
    fi
else
    echo -e "${RED}✗ Skipping - No access token${NC}"
fi
echo

echo "8. Testing Authorization Code Flow"
echo "-----------------------------------"
AUTH_RESPONSE=$(curl -s "${OAUTH_SERVER}/authorize?response_type=code&client_id=test-client&redirect_uri=http://localhost:3000/callback&scope=openid%20profile%20email")
CODE=$(echo $AUTH_RESPONSE | jq -r '.code' 2>/dev/null)

if [ "$CODE" != "null" ] && [ ! -z "$CODE" ]; then
    echo -e "${GREEN}✓ Authorization code generated${NC}"
    echo "  Code: $CODE"
    
    # Exchange code for token
    TOKEN_RESPONSE=$(curl -s -X POST "${OAUTH_SERVER}/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=authorization_code" \
      -d "code=$CODE" \
      -d "redirect_uri=http://localhost:3000/callback" \
      -d "client_id=test-client" \
      -d "client_secret=test-secret")
    
    CODE_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token' 2>/dev/null)
    if [ "$CODE_TOKEN" != "null" ] && [ ! -z "$CODE_TOKEN" ]; then
        echo -e "${GREEN}✓ Code exchange successful${NC}"
    else
        echo -e "${RED}✗ Code exchange failed${NC}"
    fi
else
    echo -e "${RED}✗ Authorization code generation failed${NC}"
fi
echo

echo "==========================================";
echo "Testing Resource Server (if running)"
echo "==========================================";
echo

# Check if resource server is running
curl -s "${RESOURCE_SERVER}/api/public/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "9. Testing Resource Server Endpoints"
    echo "-------------------------------------"
    
    # Test public endpoint
    HEALTH=$(curl -s "${RESOURCE_SERVER}/api/public/health")
    STATUS=$(echo $HEALTH | jq -r '.status' 2>/dev/null)
    if [ "$STATUS" = "UP" ]; then
        echo -e "${GREEN}✓ Public endpoint accessible${NC}"
    else
        echo -e "${RED}✗ Public endpoint failed${NC}"
    fi
    
    # Test protected endpoints
    if [ ! -z "$ACCESS_TOKEN" ]; then
        # User profile endpoint
        PROFILE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
          "${RESOURCE_SERVER}/api/user/profile")
        PROFILE_USER=$(echo $PROFILE | jq -r '.username' 2>/dev/null)
        if [ "$PROFILE_USER" = "testuser" ]; then
            echo -e "${GREEN}✓ User profile endpoint working${NC}"
        else
            echo -e "${RED}✗ User profile endpoint failed${NC}"
        fi
        
        # Admin endpoint
        ADMIN=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
          "${RESOURCE_SERVER}/api/admin/users")
        ADMIN_MSG=$(echo $ADMIN | jq -r '.message' 2>/dev/null)
        if [ "$ADMIN_MSG" = "Admin access granted" ]; then
            echo -e "${GREEN}✓ Admin endpoint accessible${NC}"
        else
            echo -e "${RED}✗ Admin endpoint failed${NC}"
        fi
        
        # Upload endpoint
        UPLOAD=$(curl -s -X POST -H "Authorization: Bearer $ACCESS_TOKEN" \
          "${RESOURCE_SERVER}/api/upload/file")
        UPLOAD_MSG=$(echo $UPLOAD | jq -r '.message' 2>/dev/null)
        if [ "$UPLOAD_MSG" = "Upload permission granted" ]; then
            echo -e "${GREEN}✓ Upload endpoint accessible${NC}"
        else
            echo -e "${RED}✗ Upload endpoint failed${NC}"
        fi
    else
        echo -e "${RED}✗ Cannot test protected endpoints - No access token${NC}"
    fi
else
    echo "Resource Server is not running on port 8081"
    echo "Start it with: cd resource-server && mvn spring-boot:run"
fi

echo
echo "==========================================";
echo "Test Summary"
echo "==========================================";
echo "OAuth Server endpoints tested successfully!"
echo "To start the servers:"
echo "  OAuth Server: cd mock-oauth-server && mvn spring-boot:run"
echo "  Resource Server: cd resource-server && mvn spring-boot:run"
