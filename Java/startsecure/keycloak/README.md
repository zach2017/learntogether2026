# Enabling roles and groups in OAuth tokens for a Java client in Keycloak.

## Step-by-Step Guide

### Step 1: Create Client Scopes for Roles and Groups

1. **Log into Keycloak Admin Console**
   - Navigate to your realm

2. **Create/Configure Client Scopes**
   - Go to **Client Scopes** in the left menu
   - Keycloak has default scopes: `roles` and `groups`
   - Click on **roles** scope:
     - Go to **Mappers** tab
     - Verify "realm roles" and "client roles" mappers exist
     - If not, click **Add mapper** → **By configuration** → **User Realm Role**
   
   - Click on **groups** scope (or create it):
     - Go to **Mappers** tab
     - Click **Add mapper** → **By configuration** → **Group Membership**
     - Configure:
       - **Name**: groups
       - **Token Claim Name**: groups
       - **Full group path**: ON/OFF (your preference)
       - **Add to ID token**: ON
       - **Add to access token**: ON
       - **Add to userinfo**: ON

### Step 2: Configure Your Java Client

1. **Navigate to Clients**
   - Go to **Clients** in the left menu
   - Select your Java client (or create new)

2. **Assign Client Scopes**
   - Go to **Client Scopes** tab
   - Under **Assigned Default Client Scopes** or **Assigned Optional Client Scopes**:
     - Click **Add client scope**
     - Add **roles** scope (set as Default)
     - Add **groups** scope (set as Default)

3. **Configure Client Settings**
   - In **Settings** tab:
     - **Client Protocol**: openid-connect
     - **Access Type**: confidential (for server-side Java apps)
     - **Standard Flow Enabled**: ON
     - **Direct Access Grants Enabled**: ON (if needed)
     - Save changes

### Step 3: Create and Assign Roles

1. **Create Realm Roles**
   - Go to **Realm Roles**
   - Click **Create Role**
   - Name: e.g., "admin", "user", "manager"
   - Save

2. **Create Client Roles** (optional)
   - Go to **Clients** → Select your client
   - Go to **Roles** tab
   - Click **Create Role**
   - Name: e.g., "app-admin"
   - Save

### Step 4: Create and Configure Groups

1. **Create Groups**
   - Go to **Groups** in the left menu
   - Click **Create group**
   - Name: e.g., "Administrators", "Users"
   - Save

2. **Assign Roles to Groups** (optional)
   - Select the group
   - Go to **Role Mapping** tab
   - Click **Assign role**
   - Select realm or client roles
   - Assign desired roles

### Step 5: Assign Roles and Groups to User

1. **Navigate to User**
   - Go to **Users** in the left menu
   - Search and select your user

2. **Assign Roles**
   - Go to **Role Mapping** tab
   - Click **Assign role**
   - Filter by **Realm roles** or **Client roles**
   - Select roles and click **Assign**

3. **Assign Groups**
   - Go to **Groups** tab
   - Click **Join Group**
   - Select the group(s)
   - Click **Join**

### Step 6: Verify Token Contents

1. **Test the Configuration**
   - Use your Java client to authenticate
   - Decode the JWT access token at [jwt.io](https://jwt.io)

2. **Expected Token Structure**:
```json
{
  "realm_access": {
    "roles": ["admin", "user"]
  },
  "resource_access": {
    "your-client-id": {
      "roles": ["app-admin"]
    }
  },
  "groups": [
    "/Administrators",
    "/Users"
  ]
}
```

### Step 7: Java Client Configuration Example

```java
// In your application.properties or application.yml
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8080/realms/your-realm

// Access roles in Java
@GetMapping("/admin")
@PreAuthorize("hasRole('admin')")
public String adminEndpoint() {
    return "Admin access";
}

// Access groups
@PreAuthorize("hasAuthority('/Administrators')")
public String groupBasedAccess() {
    return "Group-based access";
}
```

## Important Notes

- **Default vs Optional Scopes**: Default scopes are always included; optional scopes require explicit request
- **Token Size**: Adding many roles/groups increases token size
- **Composite Roles**: You can create composite roles that include other roles
- **Group Hierarchy**: Enable "Full group path" to see parent/child relationships

This configuration ensures your Java client receives roles and groups in the OAuth tokens for authorization decisions.