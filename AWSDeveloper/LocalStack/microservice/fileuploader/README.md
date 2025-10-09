
I'll create a Java Spring Boot microservice with Swagger documentation and a styled HTML frontend form.Perfect! I've created a complete Java Spring Boot microservice with Swagger documentation and a styled HTML frontend. Here's what I've built:

## Backend Components:

1. **FileTypeController.java** - REST controller with:
   - POST endpoint `/api/v1/files/detect-type`
   - Accepts PDF and image files
   - Returns file type as a string
   - Full Swagger/OpenAPI annotations
   - CORS enabled for frontend integration

2. **pom.xml** - Maven dependencies including:
   - Spring Boot Web
   - SpringDoc OpenAPI (Swagger UI)
   - Spring Boot Test

3. **application.properties** - Configuration for:
   - Server port (8080)
   - File upload limits (10MB)
   - Swagger UI paths

4. **FileTypeControllerTest.java** - Comprehensive tests for:
   - PDF detection
   - JPEG/PNG detection
   - Unsupported file types
   - Empty files
   - Invalid filenames

## Frontend:

5. **HTML Form** - Beautiful Tailwind CSS styled form with:
   - File upload input
   - Modern gradient design
   - Success/error notifications
   - Loading spinner
   - Responsive layout

## To Run:

1. **Backend**:
   ```bash
   mvn spring-boot:run
   ```
   - Access Swagger UI at: `http://localhost:8080/swagger-ui.html`
   - API docs at: `http://localhost:8080/api-docs`

2. **Frontend**: 
   - Open the HTML file in a browser
   - Upload a PDF or image file
   - See the detected file type instantly

The service supports PDF, JPG, JPEG, PNG, GIF, BMP, WebP, SVG, and TIFF files!

