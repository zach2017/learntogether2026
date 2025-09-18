import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions
interface CustomError extends Error {
  status?: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

interface ApiResponse<T = any> {
  status: string;
  message: string;
  data?: T;
  timestamp: string;
}

interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  environment: string;
  uptime: number;
}

interface SecurityHeadersResponse {
  headers: Record<string, string | undefined>;
  clientIp: string | undefined;
  userAgent: string | undefined;
}

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

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
const corsOptions: CorsOptions = {
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
app.use((req: Request, res: Response, next: NextFunction): void => {
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
// Note: This assumes your React Vite build output is in the 'react-build' folder
// If your React build is in 'dist', you may need to adjust paths to avoid conflicts
const reactBuildPath = process.env.REACT_BUILD_PATH || path.join(__dirname, '..', 'react-build');

app.use(express.static(reactBuildPath, {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res: Response, filePath: string): void => {
    // Additional security for static files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Set proper MIME types for common React build files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Utility function to create API responses
const createApiResponse = <T>(
  status: string, 
  message: string, 
  data?: T
): ApiResponse<T> => ({
  status,
  message,
  data,
  timestamp: new Date().toISOString()
});

// JWT Token validation middleware (basic example)
const validateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(createApiResponse('error', 'Bearer token required'));
    return;
  }
  
  const token = authHeader.substring(7);
  
  // In a real application, you would validate the JWT token with Keycloak
  // This is just a basic example
  if (token.length === 0) {
    res.status(401).json(createApiResponse('error', 'Invalid token'));
    return;
  }
  
  // Mock user data (in real app, decode from JWT)
  req.user = {
    id: 'user-123',
    email: 'user@example.com',
    roles: ['user']
  };
  
  next();
};

// API routes
app.get('/api/health', (req: Request, res: Response): void => {
  const healthResponse: HealthCheckResponse = {
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  };
  
  res.json(healthResponse);
});

// Example API route with input validation
app.get('/api/data', (req: Request, res: Response): void => {
  // Basic input sanitization example
  const query = req.query.search ? String(req.query.search).trim() : '';
  
  const responseData = {
    message: 'Hello from the API!',
    query: query.length > 0 ? query.substring(0, 100) : null // Limit query length
  };
  
  res.json(createApiResponse('success', 'Data retrieved successfully', responseData));
});

// Example protected API route with Keycloak token validation
app.get('/api/protected', validateToken, (req: AuthenticatedRequest, res: Response): void => {
  const responseData = {
    message: 'Access granted to protected resource',
    user: req.user,
    tokenValidated: true
  };
  
  res.json(createApiResponse('success', 'Protected resource accessed', responseData));
});

// Keycloak logout endpoint proxy (optional)
app.post('/api/auth/logout', (req: Request, res: Response): void => {
  // Clear any server-side session data
  const responseData = {
    keycloakLogoutUrl: `https://mykeylock:8080/auth/realms/${process.env.KEYCLOAK_REALM || 'your-realm'}/protocol/openid-connect/logout`
  };
  
  res.json(createApiResponse('success', 'Logout successful', responseData));
});

// Security endpoint to check headers (useful for debugging)
app.get('/api/security-headers', (req: Request, res: Response): void => {
  const securityHeaders: SecurityHeadersResponse = {
    headers: {
      'content-security-policy': res.getHeader('Content-Security-Policy') as string,
      'x-xss-protection': res.getHeader('X-XSS-Protection') as string,
      'x-content-type-options': res.getHeader('X-Content-Type-Options') as string,
      'x-frame-options': res.getHeader('X-Frame-Options') as string,
      'strict-transport-security': res.getHeader('Strict-Transport-Security') as string
    },
    clientIp: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  res.json(createApiResponse('success', 'Security headers retrieved', securityHeaders));
});

// 404 handler for API routes
app.use('/api/*', (req: Request, res: Response): void => {
  res.status(404).json(createApiResponse('error', 'API endpoint not found', { path: req.originalUrl }));
});

// Catch all handler: send back React's index.html file for client-side routing
// This ensures that React Router works properly for all non-API routes
app.get('*', (req: Request, res: Response): void => {
  const indexPath = path.join(reactBuildPath, 'index.html');
  
  // Check if the React build exists
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('React build not found at:', indexPath);
      res.status(500).json(createApiResponse('error', 'React application not found. Please build your React app first.'));
    }
  });
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
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
  
  const errorResponse = createApiResponse(
    'error',
    isDevelopment ? err.message : 'Internal Server Error',
    isDevelopment ? { stack: err.stack } : undefined
  );
  
  res.status(err.status || 500).json(errorResponse);
};

app.use(errorHandler);

app.listen(PORT, (): void => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('🔒 Allowed CORS origins:', corsOptions.origin);
  console.log('🛡️  Security features enabled: Helmet, CORS, Rate Limiting');
  console.log('🔐 Keycloak integration ready at: mykeylock');
});