# Ollama model specialized in generating Python FastAPI APIs based on the Qwen 3.8B model

## 📦 Components Created:

1. **Dockerfile** - Builds a custom Ollama image with your FastAPI-specialized model
2. **Modelfile** - Configures the Qwen 3.8B model specifically for FastAPI code generation with:
   - Optimized parameters for code generation (lower temperature for consistency)
   - System prompt that enforces FastAPI-only responses
   - Best practices for FastAPI development

3. **docker-compose.yml** - Orchestrates both services:
   - Ollama service with the custom model
   - Nginx web server for the chat UI
   - Proper health checks and resource limits

4. **nginx.conf** - Web server configuration with CORS support

5. **Updated HTML** - Enhanced chat interface with:
   - Dark theme optimized for code display
   - Syntax highlighting for Python code
   - Loading indicators
   - Better error handling
   - Example prompts for FastAPI generation

6. **Setup Script** - Automated deployment script

## 🚀 How to Deploy:

1. Save all the files in a directory
2. Make sure Docker and Docker Compose are installed
3. Run the setup script or manually execute:
   ```bash
   docker-compose up -d --build
   ```

4. Wait for the Qwen model to download (approximately 2GB, first time only)
5. Access the chat interface at `http://localhost:8080`

## 🎯 Features:

- **Specialized Model**: The Qwen model is configured to ONLY generate FastAPI code
- **Production Ready**: Includes proper error handling, type hints, and best practices
- **Code Highlighting**: Beautiful syntax highlighting for generated Python code
- **Persistent Storage**: Model data is stored in Docker volumes
- **Health Checks**: Automatic monitoring of service availability
- **Resource Management**: Memory limits to prevent system overload

## 💡 Usage Examples:

Once running, you can ask the model to:
- "Create a REST API for user authentication with JWT"
- "Generate CRUD endpoints for a blog application"
- "Build a WebSocket chat server with FastAPI"
- "Create an API with SQLAlchemy and Alembic migrations"

The model will respond ONLY with FastAPI-related code and explanations, making it a specialized tool for FastAPI development.