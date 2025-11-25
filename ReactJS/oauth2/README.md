# Keycloak OAuth2 React App

A React + Vite application with Keycloak OAuth2/OIDC authentication, featuring session timeout after 5 minutes of inactivity.

## Features

- ✅ OAuth2/OIDC authentication with Keycloak
- ✅ Protected routes requiring authentication
- ✅ Automatic session expiration after 5 minutes of inactivity
- ✅ Display user roles from Keycloak
- ✅ Modern, responsive UI

## Prerequisites

Before running this application, you need to have:

1. **Node.js** (v16 or higher)
2. **Keycloak Server** running and configured

## Keycloak Setup

### 1. Install and Start Keycloak

Download Keycloak from [https://www.keycloak.org/downloads](https://www.keycloak.org/downloads) or run with Docker:

```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

### 2. Configure Keycloak

1. Access Keycloak admin console: `http://localhost:8080`
2. Login with admin credentials (admin/admin if using Docker command above)
3. Create a new realm (e.g., "myrealm") or use an existing one
4. Create a new client:
   - Client ID: `react-app` (or your preferred name)
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs: `http://localhost:5173/*`
   - Web Origins: `http://localhost:5173`
5. Create users and assign roles as needed

### 3. Update Application Configuration

Edit `src/keycloak.js` with your Keycloak settings:

```javascript
const keycloak = new Keycloak({
  url: 'http://localhost:8080',  // Your Keycloak server URL
  realm: 'myrealm',               // Your realm name
  clientId: 'react-app',          // Your client ID
});
```

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## How It Works

### Authentication Flow

1. User visits the app and is redirected to `/login`
2. Clicking "Login with Keycloak" redirects to Keycloak login page
3. After successful authentication, user is redirected to `/secure` page
4. The secure page displays:
   - Personalized greeting
   - User information (email, name)
   - Assigned roles from Keycloak
   - Session timeout warning

### Session Timeout

- The app monitors user activity (mouse, keyboard, scroll, touch events)
- After 5 minutes of inactivity, the session automatically expires
- User is logged out and shown an alert
- Activity timer resets with each user interaction

### User Roles

The app displays both:
- **Realm roles**: Roles assigned at the realm level
- **Client roles**: Roles assigned specifically to this client

## Project Structure

```
src/
├── App.jsx                 # Main app component with routing
├── App.css                 # Global styles
├── AuthContext.jsx         # Authentication context and session management
├── keycloak.js            # Keycloak configuration
├── Login.jsx              # Login page component
├── Login.css              # Login page styles
├── SecurePage.jsx         # Protected page component
├── SecurePage.css         # Secure page styles
└── ProtectedRoute.jsx     # Route guard component
```

## Customization

### Change Session Timeout

Edit `INACTIVITY_TIMEOUT` in `src/AuthContext.jsx`:

```javascript
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
```

### Modify Authentication Behavior

Update the Keycloak initialization options in `src/AuthContext.jsx`:

```javascript
const auth = await keycloak.init({
  onLoad: 'check-sso',        // or 'login-required'
  checkLoginIframe: false,
  pkceMethod: 'S256'
});
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Keycloak JS** - Keycloak JavaScript adapter
- **React Router** - Client-side routing

## Troubleshooting

### CORS Issues

Make sure your Keycloak client has the correct Web Origins configured (`http://localhost:5173` for development).

### Session Not Expiring

Check browser console for errors. Ensure the inactivity timer is properly initialized after authentication.

### Roles Not Showing

Verify that:
1. Roles are assigned to the user in Keycloak
2. The client has role mappings configured
3. The token includes the roles (check token in browser dev tools)

## License

MIT
