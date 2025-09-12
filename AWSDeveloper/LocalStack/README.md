# Localstack

# File Upload to LocalStack S3

A complete Docker Compose setup with a React Vite.js frontend, Node.js backend, and LocalStack for AWS S3 emulation.

## 🏗️ Architecture

- **Frontend**: React with Vite.js (Port 5173)
- **Backend**: Node.js/Express API (Port 3001)
- **Storage**: LocalStack S3 emulation (Port 4566)
- **Containerization**: Docker Compose

## 🚀 Features

- File upload with drag & drop interface
- Real-time upload progress
- File listing with metadata
- File download functionality
- File deletion
- Responsive design
- Error handling
- CORS configuration for LocalStack

## 📋 Prerequisites

- Docker and Docker Compose
- Git (optional)

## 🛠️ Setup Instructions

### Option 1: Manual Setup

1. **Create project structure:**
```bash
mkdir file-upload-project
cd file-upload-project
mkdir -p frontend/src backend localstack-init
```

2. **Copy all the provided files** into their respective directories:
   - `docker-compose.yml` in the root
   - Frontend files in `frontend/`
   - Backend files in `backend/`
   - `cors.json` in `localstack-init/`

3. **Run the application:**
```bash
docker-compose up --build
```

### Option 2: Using Setup Script

1. **Run the setup script** (creates directory structure and config files)
2. **Copy the source code files** from the artifacts
3. **Start the services:**
```bash
docker-compose up --build
```

## 📁 Project Structure

```
file-upload-project/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── index.css
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── localstack-init/
    └── cors.json
```

## 🌐 Access URLs

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **LocalStack Dashboard**: http://localhost:4566
- **Health Check**: http://localhost:3001/health

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload a file |
| `GET` | `/files` | List all uploaded files |
| `GET` | `/download/:key` | Download a specific file |
| `DELETE` | `/delete/:key` | Delete a specific file |
| `POST` | `/generate-upload-url` | Generate presigned upload URL |
| `GET` | `/health` | Health check |

## 🐳 Docker Services

### Frontend Service
- **Image**: Node.js 18 Alpine
- **Port**: 5173
- **Hot Reload**: Enabled for development

### Backend Service
- **Image**: Node.js 18 Alpine
- **Port**: 3001
- **Features**: File upload, S3 integration, CORS

### LocalStack Service
- **Image**: LocalStack latest
- **Port**: 4566
- **Services**: S3, IAM
- **Persistence**: Enabled

### Init Service
- **Purpose**: Creates S3 bucket and configures CORS
- **Runs**: Once during startup

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT_URL=http://localstack:4566
S3_BUCKET_NAME=file-uploads
VITE_API_URL=http://localhost:3001
```

### File Upload Limits
- **Maximum file size**: 10MB
- **Storage**: In-memory processing with S3 persistence
- **Supported formats**: All file types

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001, 4566, and 5173 are available
2. **Docker permissions**: Run with appropriate Docker permissions
3. **File upload fails**: Check LocalStack logs for S3 bucket creation
4. **CORS errors**: Verify the init container completed successfully

### Useful Commands

```bash
# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build

# Check LocalStack S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List files in bucket
aws --endpoint-url=http://localhost:4566 s3 ls s3://file-uploads/
```

## 🧪 Testing

1. **Health Check**: Visit http://localhost:3001/health
2. **File Upload**: Use the web interface at http://localhost:5173
3. **API Testing**: Use curl or Postman with the API endpoints

### Example API Usage

```bash
# Upload a file
curl -X POST -F "file=@example.txt" http://localhost:3001/upload

# List files
curl http://localhost:3001/files

# Download a file
curl -o downloaded-file.txt "http://localhost:3001/download/uploads/1234567890-example.txt"
```

## 🔒 Security Notes

- This setup is for **development only**
- LocalStack uses test credentials
- No authentication implemented
- CORS is configured to allow all origins

## 📦 Dependencies

### Frontend
- React 18
- Vite 5
- Axios for HTTP requests

### Backend
- Express.js web framework
- Multer for file uploads
- AWS SDK v3 for S3 operations
- CORS middleware

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.