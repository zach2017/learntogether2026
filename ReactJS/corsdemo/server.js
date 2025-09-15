const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - Helmet for various security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://mykeylock"], // Allow Keycloak images/avatars
      connectSrc: [
        "'self'", 
        "ws://localhost:3000", 
        "wss://localhost:3000",
        "ws://127.0.0.1:3000",
        "wss://127.0.0.1:3000",
        "ws://localhost:5173", 
        "wss://localhost:5173",
        "https://api.example.com", // Additional host for API calls
        "wss://api.example.com",   // WebSocket support for additional host
        "https://mykeylock",       // Keycloak server for auth requests
        "https://mykeylock:8080",  // Common Keycloak port
        "http://mykeylock:8080"    // Development Keycloak (if using HTTP)
      ],
      frameSrc: [
        "'self'",
        "https://mykeylock",       // Allow Keycloak login iframe
        "https://mykeylock:8080",
        "http://mykeylock:8080"
      ],
      frameAncestors: ["'self'"],  // Control who can embed this app
      formAction: [
        "'self'",
        "https://mykeylock",       // Allow form submissions to Keycloak
        "https://mykeylock:8080",
        "http://mykeylock:8080"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable if you need to embed external resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS configuration with enhanced security
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server default
    'http://localhost:3000', // Self (this server)
    'http://127.0.0.1:3000', // Self with different localhost format
    'https://api.example.com', // Additional allowed host
    'https://mykeylock',      // Keycloak server (HTTPS)
    'https://mykeylock:8080', // Keycloak with custom port (HTTPS)
    'http://mykeylock:8080',  // Keycloak development (HTTP)
    // Add your additional allowed hosts here
    // 'https://yourdomain.com',
    // 'https://anotherdomain.com'
  ],
  credentials: true, // Allow cookies and credentials (important for Keycloak)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Forwarded-For',
    'X-Forwarded-Proto'
  ],
  exposedHeaders: ['X-Total-Count'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400 // 24 hours - how long browser can cache preflight response
};

// Enable CORS with specified options
app.use(cors(corsOptions));

// Additional security headers middleware
app.use((req, res, next) => {
  // XSS Protection (legacy header, CSP is preferred)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Control framing (already handled by helmet, but explicit for clarity)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// Middleware for parsing JSON with size limits
app.use(express.json({ limit: '10mb' })); // Adjust size limit as needed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (important for rate limiting and security headers in production)
app.set('trust proxy', 1);

// Serve static files from React build directory with security headers
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Additional security for static files
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// API routes (add your API routes here)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Example protected API route with Keycloak token validation
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Bearer token required' 
    });
  }
  
  // In a real application, you would validate the JWT token with Keycloak
  // This is just a basic example
  const token = authHeader.substring(7);
  
  res.json({ 
    message: 'Access granted to protected resource',
    timestamp: new Date().toISOString(),
    tokenReceived: token.length > 0
  });
});

// Keycloak logout endpoint proxy (optional)
app.post('/api/auth/logout', (req, res) => {
  // Clear any server-side session data
  // Redirect or return success response
  res.json({ 
    message: 'Logout successful',
    keycloakLogoutUrl: 'https://mykeylock:8080/auth/realms/your-realm/protocol/openid-connect/logout'
  });
});

// Security endpoint to check headers (useful for debugging)
app.get('/api/security-headers', (req, res) => {
  res.json({
    headers: {
      'content-security-policy': res.getHeader('Content-Security-Policy'),
      'x-xss-protection': res.getHeader('X-XSS-Protection'),
      'x-content-type-options': res.getHeader('X-Content-Type-Options'),
      'x-frame-options': res.getHeader('X-Frame-Options'),
      'strict-transport-security': res.getHeader('Strict-Transport-Security')
    },
    clientIp: req.ip,
    userAgent: req.get('User-Agent')
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Allowed CORS origins:', corsOptions.origin);
});