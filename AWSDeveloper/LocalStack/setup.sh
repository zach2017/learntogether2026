#!/bin/bash

# setup.sh - Complete setup script for the file upload project

echo "🚀 Setting up File Upload to LocalStack S3 project..."

# Create project structure
mkdir -p file-upload-project/{frontend/src,backend,localstack-init}
cd file-upload-project

echo "📁 Created project directory structure"

# Create frontend files
echo "⚛️ Setting up React frontend..."
cat > frontend/package.json << 'EOF'
{
  "name": "file-upload-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.0.8"
  }
}
EOF

# Create backend package.json
echo "🔧 Setting up Node.js backend..."
cat > backend/package.json << 'EOF'
{
  "name": "file-upload-backend",
  "version": "1.0.0",
  "description": "Backend API for file uploads to LocalStack S3",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# Create CORS configuration for LocalStack
cat > localstack-init/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Create .env file
cat > .env << 'EOF'
# Environment variables
NODE_ENV=development
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT_URL=http://localstack:4566
S3_BUCKET_NAME=file-uploads
VITE_API_URL=http://localhost:3001
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Production builds
dist/
build/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# LocalStack data
.localstack/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

echo "✅ Project setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the provided Docker Compose configuration"
echo "2. Copy all the frontend and backend source files"
echo "3. Run: docker-compose up --build"
echo "4. Access the app at http://localhost:5173"
echo ""
echo "🔗 Useful URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   LocalStack: http://localhost:4566"
echo ""
echo "📚 API Endpoints:"
echo "   POST /upload - Upload file"
echo "   GET /files - List uploaded files"
echo "   GET /download/:key - Download file"
echo "   DELETE /delete/:key - Delete file"
echo "   GET /health - Health check"