# Express + React TypeScript Server

A secure Express.js server that serves a React Vite build with comprehensive security features, CORS configuration, and Keycloak integration.

Perfect! The server is already configured to serve a React build from the `dist` directory, but let me clarify and enhance the setup to make it crystal clear how it handles both the TypeScript compilation and React build serving:Now let me create a helpful README to explain the dual build setup:Perfect! I've enhanced the server configuration to properly handle serving a React build alongside the TypeScript Express server. Here are the key improvements:

## 🎯 **Dual Build Setup:**

### **1. Separate Build Directories:**
- **`dist/`** - Compiled TypeScript server files
- **`react-build/`** - React Vite build output (served by Express)
- This prevents conflicts between TypeScript and React builds

### **2. Enhanced React Serving:**
- **Configurable path** via `REACT_BUILD_PATH` environment variable
- **Proper MIME types** for React build files (.js, .css, .json)
- **Error handling** if React build is missing
- **Client-side routing support** for React Router

### **3. Build Scripts:**
```bash
# Build TypeScript server only
npm run build:server

# Build React app and copy to react-build
npm run build:react

# Build both React and server
npm run build:all

# Build everything and start server
npm run serve:react
```

## 📁 **Recommended Directory Structure:**
```
project-root/
├── src/
│   └── server.ts          # TypeScript Express server
├── dist/                  # Compiled TypeScript → Express server
├── react-build/           # React Vite build → Served by Express
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 **Setup Your React App:**

### **Option 1: Manual Copy**
```bash
# In your React Vite project
npm run build

# Copy to Express server project
cp -r dist ../express-server/react-build
```

### **Option 2: Environment Variable**
```bash
# Set custom React build path
export REACT_BUILD_PATH=/path/to/your/react/dist

# Or in .env file
REACT_BUILD_PATH=/path/to/your/react/dist
```

### **Option 3: Automated Build Script**
```bash
# Uses the build:react script (modify path as needed)
npm run build:react
```

## 🌐 **How It Works:**

1. **API Routes** (`/api/*`) - Handled by Express server
2. **Static Assets** (JS, CSS, images) - Served from `react-build/`
3. **Client-side Routes** (`/*`) - Falls back to React's `index.html`
4. **Development** - Run React dev server separately or build and serve through Express

## 🚀 **Development Workflow:**

### **Separate Development (Recommended):**
```bash
# Terminal 1: React with hot reload
cd react-app && npm run dev  # localhost:5173

# Terminal 2: Express API server
cd express-server && npm run dev  # localhost:3000
```

### **Integrated Development:**
```bash
# Build React and serve through Express
npm run serve:react  # localhost:3000
```

The server now perfectly handles both serving your React app and providing API endpoints with full TypeScript support and comprehensive security! 🎉

## 📁 Project Structure

```
project-root/
├── src/
│   └── server.ts          # TypeScript Express server
├── dist/                  # Compiled TypeScript server
├── react-build/           # React Vite build output (served by Express)
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Your React App
```bash
# From your React project directory
npm run build

# Copy the dist folder to this project as 'react-build'
cp -r dist ../express-server/react-build
```

### 3. Run the Server
```bash
# Development mode (TypeScript with hot reload)
npm run dev

# Production mode
npm run build && npm start
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development mode with hot reload |
| `npm run build` | Build TypeScript server only |
| `npm run build:server` | Build TypeScript server |
| `npm run build:react` | Build React app and copy to react-build |
| `npm run build:all` | Build both React and server |
| `npm run start` | Run production server |
| `npm run serve:react` | Build everything and start server |
| `npm run clean` | Clean all build artifacts |
| `npm run type-check` | TypeScript type checking only |

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```bash
PORT=3000
NODE_ENV=development
REACT_BUILD_PATH=/path/to/react/build
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
```

### React Build Path
The server looks for React build in this order:
1. `REACT_BUILD_PATH` environment variable
2. `../react-build` (default)
3. Fallback error if not found

## 🔒 Security Features

- **Helmet.js** - Security headers (CSP, HSTS, XSS Protection)
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - API endpoint protection
- **Input Validation** - Request sanitization
- **Error Handling** - Secure error responses
- **Compression** - Gzip compression for performance

## 🔐 Keycloak Integration

The server is pre-configured for Keycloak authentication:

### Allowed Hosts
- `https://mykeylock` (production)
- `https://mykeylock:8080` (with port)
- `http://mykeylock:8080` (development)

### API Endpoints
- `GET /api/health` - Health check
- `GET /api/protected` - Protected route (requires Bearer token)
- `POST /api/auth/logout` - Logout endpoint
- `GET /api/security-headers` - Security headers info

## 🌐 CORS Configuration

Currently allows:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (this server)
- `https://api.example.com` (additional API host)
- `https://mykeylock*` (Keycloak server)

## 📦 React App Integration

### Automatic Setup
The server automatically:
1. Serves React static files from `react-build/`
2. Handles client-side routing (React Router)
3. Sets appropriate cache headers
4. Provides fallback to `index.html` for SPA routing

### Manual Setup
1. Build your React app: `npm run build`
2. Copy build output to `react-build/` in this project
3. Start the Express server: `npm start`

### Vite Integration Example
```bash
# In your React Vite project
npm run build

# Copy build to Express server
cp -r dist ../express-server/react-build

# Start Express server
cd ../express-server
npm start
```

## 🔄 Development Workflow

### Option 1: Separate Development
```bash
# Terminal 1: React development
cd react-app
npm run dev # Runs on localhost:5173

# Terminal 2: Express development  
cd express-server
npm run dev # Runs on localhost:3000
```

### Option 2: Integrated Development
```bash
# Build React and serve through Express
npm run serve:react
```

## 🚀 Production Deployment

```bash
# 1. Build React app
npm run build:react

# 2. Build Express server
npm run build:server

# 3. Start production server
npm start
```

## 📊 API Routes

All API routes are prefixed with `/api/`:
- Automatic rate limiting (100 requests/15 minutes)
- Security headers applied
- CORS enabled for allowed origins
- Proper error handling

## 🛠 Customization

### Adding New Hosts
Update CORS origins in `src/server.ts`:
```typescript
origin: [
  'https://your-domain.com',
  // ... other origins
]
```

### Changing React Build Path
Set environment variable:
```bash
export REACT_BUILD_PATH=/path/to/your/react/build
```

## 🐛 Troubleshooting

### Common Issues

1. **React build not found**
   - Ensure React app is built: `npm run build`
   - Check `react-build/` directory exists
   - Verify `REACT_BUILD_PATH` if using custom path

2. **CORS errors**
   - Add your domain to `corsOptions.origin` array
   - Check browser network tab for specific error

3. **TypeScript compilation errors**
   - Run `npm run type-check` for detailed errors
   - Ensure all dependencies have type definitions

4. **ES Module errors**
   - Ensure `"type": "module"` in package.json
   - Use ES6 import/export syntax only

## 📝 License

MIT

