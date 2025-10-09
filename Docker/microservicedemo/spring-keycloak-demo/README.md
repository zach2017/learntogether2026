# Spring Boot + Keycloak (RBAC: owner-only)

This demo spins up:
- **Keycloak** (realm: `springrealm`) with realm roles `owner` and `guest`.
- **api-service** protected by Keycloak; `/secure-data` requires ROLE_owner.
- **client-service** that calls the API using **client_credentials**; its service account is given `owner` role in the realm export, so it can access `/secure-data`.

## Quick start

```bash
docker compose up --build
```

Once healthy:

- Public API: http://localhost:8081/public-data
- Secure API (owner only): http://localhost:8081/secure-data
- Client calls:
  - http://localhost:8082/client/public
  - http://localhost:8082/client/secure

Keycloak admin: http://localhost:8080/  
Login: `admin` / `admin`

### Users for manual testing (password grant via curl/Postman)
- `owneruser` / `password`  (has realm role `owner`)
- `guestuser` / `password`  (has realm role `guest`)

### Verifying JWT roles
Tokens contain `realm_access.roles`. The API maps these to Spring authorities prefixed with `ROLE_`.
`@PreAuthorize("hasRole('owner')")` enforces the rule.

If you change roles, restart api-service to clear cached JWKS if necessary.

### Notes
- The client uses **client credentials** and the **service-account-client-service** has the `owner` realm role via the realm export. This mirrors B2B server-to-server calls.
- For user-driven flows (Authorization Code with PKCE), switch the client registration and add a simple UI or OAuth2Login.
