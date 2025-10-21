# upload

I'll help you create a Java web application using Quartus (I assume you mean Quarkus, the Java framework) that allows file uploads to Azure Storage using an HTML form with Tailwind CSS.I've created a complete Quarkus application for uploading files to Azure Storage with a modern HTML interface using Tailwind CSS. Here's what this application includes:

## Key Features:

**🔧 Backend (Java/Quarkus):**
- RESTful API for file uploads
- Azure Blob Storage integration
- File validation (type, size)
- Error handling and responses
- Configuration management

**🎨 Frontend (HTML/Tailwind CSS):**
- Modern, responsive UI design
- Drag and drop file upload
- Real-time file information display
- Progress indicators
- Success/error feedback
- Beautiful gradient backgrounds and animations

**🛡️ Security & Validation:**
- File type restrictions (images, PDFs, documents)
- 10MB file size limit
- Unique file naming with UUIDs
- CORS configuration
- Content type validation

## Setup Steps:

1. **Create the project** using the Maven command provided
2. **Add dependencies** to your `pom.xml`
3. **Configure Azure** connection string in `application.yml`
4. **Set up Azure Storage Account** in Azure Portal
5. **Run the application** in development mode

## How it Works:

1. User accesses the web interface at `http://localhost:8080/api/`
2. Selects or drags a file onto the upload area
3. File is validated on both client and server side
4. File is uploaded to Azure Blob Storage with a unique name
5. User receives feedback with the file URL

The application uses Quarkus for fast startup and low memory usage, making it perfect for cloud deployments. The Tailwind CSS interface is modern and user-friendly with smooth animations and responsive design.

Would you like me to explain any specific part in more detail or help you with additional features like user authentication or file management?
This project uses Quarkus, the Supersonic Subatomic Java Framework.

If you want to learn more about Quarkus, please visit its website: <https://quarkus.io/>.

## Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
./mvnw quarkus:dev
```

> **_NOTE:_**  Quarkus now ships with a Dev UI, which is available in dev mode only at <http://localhost:8080/q/dev/>.

## Packaging and running the application

The application can be packaged using:

```shell script
./mvnw package
```

It produces the `quarkus-run.jar` file in the `target/quarkus-app/` directory.
Be aware that it’s not an _über-jar_ as the dependencies are copied into the `target/quarkus-app/lib/` directory.

The application is now runnable using `java -jar target/quarkus-app/quarkus-run.jar`.

If you want to build an _über-jar_, execute the following command:

```shell script
./mvnw package -Dquarkus.package.jar.type=uber-jar
```

The application, packaged as an _über-jar_, is now runnable using `java -jar target/*-runner.jar`.

## Creating a native executable

You can create a native executable using:

```shell script



```
I've successfully updated the application to use AWS S3 and Lambda instead of Azure Storage. Here are the key changes and new features:

## 🔄 **Major Updates:**

**🚀 Architecture Changes:**
- **AWS S3**: Primary file storage with advanced features
- **AWS Lambda**: Serverless file processing and thumbnail generation
- **Presigned URLs**: Direct client-to-S3 uploads for better performance
- **File Management**: Complete CRUD operations for files

**💡 New Features:**

1. **Dual Upload Methods:**
   - Traditional upload through Quarkus backend
   - Direct S3 upload using presigned URLs

2. **Lambda Integration:**
   - Automatic file processing after upload
   - Image thumbnail generation using Sharp library
   - Metadata extraction and updates

3. **Enhanced UI:**
   - File management panel with list/delete functionality
   - Real-time file listing from S3
   - Progress indicators with Lambda processing feedback
   - Orange/red color scheme (AWS-themed)

4. **Advanced S3 Features:**
   - Unique file naming with UUIDs
   - Custom metadata storage
   - Public/private access control
   - File size and type validation

## 🛠️ **Setup Steps:**

1. **Create S3 bucket** and configure permissions
2. **Deploy Lambda function** for file processing
3. **Set up IAM roles** with appropriate permissions
4. **Configure environment variables** for AWS credentials
5. **Update application.yml** with your AWS settings

## 🎯 **Key Benefits:**

- **Serverless Architecture**: Scales automatically with demand
- **Cost Effective**: Pay only for what you use
- **Global CDN Ready**: Easy CloudFront integration
- **High Durability**: S3's 99.999999999% durability
- **Processing Power**: Lambda handles intensive operations

# Quarkus Azure File Upload Application

This guide walks you through creating a Quarkus application that handles file uploads to Azure Blob Storage with a modern HTML interface using Tailwind CSS.

## Prerequisites

- Java 11 or higher
- Maven 3.6+
- Azure Storage Account
- IDE (IntelliJ IDEA, Eclipse, VS Code)

## Step 1: Project Setup

### Create a new Quarkus project:

```bash
mvn io.quarkus.platform:quarkus-maven-plugin:3.5.0:create \
    -DprojectGroupId=com.example \
    -DprojectArtifactId=azure-file-upload \
    -DclassName="com.example.FileUploadResource" \
    -Dpath="/upload"
```

### Navigate to project directory:
```bash
cd azure-file-upload
```

## Step 2: Add Dependencies

Add these dependencies to your `pom.xml`:

```xml
<dependencies>
    <!-- Quarkus Core -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive</artifactId>
    </dependency>
    
    <!-- File Upload Support -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive-multipart</artifactId>
    </dependency>
    
    <!-- Azure Storage -->
    <dependency>
        <groupId>com.azure</groupId>
        <artifactId>azure-storage-blob</artifactId>
        <version>12.23.0</version>
    </dependency>
    
    <!-- Configuration -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-config-yaml</artifactId>
    </dependency>
    
    <!-- JSON Processing -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive-jackson</artifactId>
    </dependency>
</dependencies>
```

## Step 3: Configuration

Create `src/main/resources/application.yml`:

```yaml
azure:
  storage:
    connection-string: "DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT_NAME;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net"
    container-name: "uploads"

quarkus:
  http:
    port: 8080
  http:
    cors:
      ~: true
      origins: "*"
      methods: "GET,POST,PUT,DELETE,OPTIONS"
      headers: "*"
```

## Step 4: Azure Storage Service

Create `src/main/java/com/example/service/AzureStorageService.java`:

```java
package com.example.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.enterprise.context.ApplicationScoped;
import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.UUID;

@ApplicationScoped
public class AzureStorageService {

    @ConfigProperty(name = "azure.storage.connection-string")
    String connectionString;

    @ConfigProperty(name = "azure.storage.container-name")
    String containerName;

    private BlobServiceClient blobServiceClient;
    private BlobContainerClient containerClient;

    @PostConstruct
    public void init() {
        this.blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
        
        this.containerClient = blobServiceClient.getBlobContainerClient(containerName);
        
        // Create container if it doesn't exist
        if (!containerClient.exists()) {
            containerClient.create();
        }
    }

    public String uploadFile(InputStream inputStream, String originalFileName, String contentType, long fileSize) {
        try {
            // Generate unique filename
            String fileExtension = getFileExtension(originalFileName);
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            
            BlobClient blobClient = containerClient.getBlobClient(uniqueFileName);
            
            // Set content type
            BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(contentType);
            
            // Upload file
            blobClient.uploadWithResponse(inputStream, fileSize, headers, null, null, null, null);
            
            return blobClient.getBlobUrl();
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to Azure Storage", e);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName != null && fileName.lastIndexOf(".") != -1) {
            return fileName.substring(fileName.lastIndexOf("."));
        }
        return "";
    }

    public boolean deleteFile(String fileName) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(fileName);
            return blobClient.deleteIfExists();
        } catch (Exception e) {
            return false;
        }
    }
}
```

## Step 5: File Upload Models

Create `src/main/java/com/example/model/UploadResponse.java`:

```java
package com.example.model;

public class UploadResponse {
    private boolean success;
    private String message;
    private String fileUrl;
    private String fileName;

    public UploadResponse() {}

    public UploadResponse(boolean success, String message, String fileUrl, String fileName) {
        this.success = success;
        this.message = message;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
    }

    // Getters and setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
}
```

## Step 6: REST Controller

Update `src/main/java/com/example/FileUploadResource.java`:

```java
package com.example;

import com.example.model.UploadResponse;
import com.example.service.AzureStorageService;
import org.jboss.resteasy.reactive.MultipartForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.List;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.MULTIPART_FORM_DATA)
public class FileUploadResource {

    @Inject
    AzureStorageService azureStorageService;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "text/plain", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public static class FileUploadForm {
        @FormParam("file")
        public FileUpload file;
    }

    @POST
    @Path("/upload")
    public Response uploadFile(@MultipartForm FileUploadForm form) {
        try {
            FileUpload fileUpload = form.file;
            
            if (fileUpload == null || fileUpload.fileName() == null || fileUpload.fileName().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new UploadResponse(false, "No file selected", null, null))
                    .build();
            }

            // Validate file size
            if (fileUpload.size() > MAX_FILE_SIZE) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new UploadResponse(false, "File size exceeds 10MB limit", null, null))
                    .build();
            }

            // Validate file type
            String contentType = Files.probeContentType(fileUpload.uploadedFile());
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new UploadResponse(false, "File type not allowed", null, null))
                    .build();
            }

            // Upload to Azure
            try (FileInputStream inputStream = new FileInputStream(fileUpload.uploadedFile().toFile())) {
                String fileUrl = azureStorageService.uploadFile(
                    inputStream, 
                    fileUpload.fileName(), 
                    contentType, 
                    fileUpload.size()
                );

                return Response.ok(new UploadResponse(
                    true, 
                    "File uploaded successfully", 
                    fileUrl, 
                    fileUpload.fileName()
                )).build();
            }

        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new UploadResponse(false, "Upload failed: " + e.getMessage(), null, null))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new UploadResponse(false, "An error occurred during upload", null, null))
                .build();
        }
    }

    @GET
    @Path("/")
    @Produces(MediaType.TEXT_HTML)
    public String getUploadPage() {
        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Azure File Upload</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            animation: {
                                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            }
                        }
                    }
                }
            </script>
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-2xl mx-auto">
                    <div class="bg-white rounded-lg shadow-xl p-8">
                        <div class="text-center mb-8">
                            <h1 class="text-3xl font-bold text-gray-800 mb-2">Azure File Upload</h1>
                            <p class="text-gray-600">Upload your files securely to Azure Blob Storage</p>
                        </div>
                        
                        <form id="uploadForm" class="space-y-6">
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <div class="space-y-4">
                                    <div class="mx-auto w-12 h-12 text-gray-400">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <label for="file" class="cursor-pointer">
                                            <span class="text-blue-600 font-medium hover:text-blue-500">Click to upload</span>
                                            <span class="text-gray-500"> or drag and drop</span>
                                        </label>
                                        <input id="file" name="file" type="file" class="hidden" accept="image/*,.pdf,.txt,.doc,.docx">
                                    </div>
                                    <p class="text-sm text-gray-500">PNG, JPG, GIF, PDF, TXT, DOC up to 10MB</p>
                                </div>
                            </div>
                            
                            <div id="fileInfo" class="hidden bg-gray-50 rounded-lg p-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p id="fileName" class="text-sm font-medium text-gray-900"></p>
                                            <p id="fileSize" class="text-xs text-gray-500"></p>
                                        </div>
                                    </div>
                                    <button type="button" id="removeFile" class="text-red-500 hover:text-red-700">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <button type="submit" id="uploadBtn" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Upload File
                            </button>
                        </form>
                        
                        <div id="progressBar" class="hidden mt-4">
                            <div class="bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full animate-pulse-slow" style="width: 0%"></div>
                            </div>
                            <p class="text-sm text-gray-600 mt-2 text-center">Uploading...</p>
                        </div>
                        
                        <div id="result" class="mt-6 hidden"></div>
                    </div>
                </div>
            </div>
            
            <script>
                const uploadForm = document.getElementById('uploadForm');
                const fileInput = document.getElementById('file');
                const fileInfo = document.getElementById('fileInfo');
                const fileName = document.getElementById('fileName');
                const fileSize = document.getElementById('fileSize');
                const removeFile = document.getElementById('removeFile');
                const uploadBtn = document.getElementById('uploadBtn');
                const progressBar = document.getElementById('progressBar');
                const result = document.getElementById('result');
                
                fileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        fileName.textContent = file.name;
                        fileSize.textContent = formatFileSize(file.size);
                        fileInfo.classList.remove('hidden');
                        uploadBtn.disabled = false;
                    }
                });
                
                removeFile.addEventListener('click', function() {
                    fileInput.value = '';
                    fileInfo.classList.add('hidden');
                    uploadBtn.disabled = true;
                    result.classList.add('hidden');
                });
                
                uploadForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const file = fileInput.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    uploadBtn.disabled = true;
                    uploadBtn.textContent = 'Uploading...';
                    progressBar.classList.remove('hidden');
                    result.classList.add('hidden');
                    
                    try {
                        const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        progressBar.classList.add('hidden');
                        result.classList.remove('hidden');
                        
                        if (data.success) {
                            result.innerHTML = `
                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div class="flex">
                                        <div class="flex-shrink-0">
                                            <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <div class="ml-3">
                                            <h3 class="text-sm font-medium text-green-800">Upload Successful!</h3>
                                            <div class="mt-2 text-sm text-green-700">
                                                <p>File: ${data.fileName}</p>
                                                <a href="${data.fileUrl}" target="_blank" class="text-blue-600 hover:text-blue-500 underline">View File</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            result.innerHTML = `
                                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div class="flex">
                                        <div class="flex-shrink-0">
                                            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <div class="ml-3">
                                            <h3 class="text-sm font-medium text-red-800">Upload Failed</h3>
                                            <div class="mt-2 text-sm text-red-700">
                                                <p>${data.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    } catch (error) {
                        progressBar.classList.add('hidden');
                        result.classList.remove('hidden');
                        result.innerHTML = `
                            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <h3 class="text-sm font-medium text-red-800">Network Error</h3>
                                        <div class="mt-2 text-sm text-red-700">
                                            <p>Please check your connection and try again.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    } finally {
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Upload File';
                    }
                });
                
                function formatFileSize(bytes) {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                }
                
                // Drag and drop functionality
                const dropZone = document.querySelector('.border-dashed');
                
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                });
                
                function preventDefaults(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, highlight, false);
                });
                
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, unhighlight, false);
                });
                
                function highlight(e) {
                    dropZone.classList.add('border-blue-400', 'bg-blue-50');
                }
                
                function unhighlight(e) {
                    dropZone.classList.remove('border-blue-400', 'bg-blue-50');
                }
                
                dropZone.addEventListener('drop', handleDrop, false);
                
                function handleDrop(e) {
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    
                    if (files.length > 0) {
                        fileInput.files = files;
                        const event = new Event('change');
                        fileInput.dispatchEvent(event);
                    }
                }
            </script>
        </body>
        </html>
        """;
    }
}
```

## Step 7: Environment Setup

### Azure Storage Account Setup:

1. **Create Azure Storage Account:**
   - Go to Azure Portal
   - Create a new Storage Account
   - Choose "StorageV2" account kind
   - Select appropriate replication option

2. **Get Connection String:**
   - Navigate to your storage account
   - Go to "Access keys" section
   - Copy the connection string

3. **Update Configuration:**
   - Replace `YOUR_ACCOUNT_NAME` and `YOUR_ACCOUNT_KEY` in `application.yml`
   - Or use the full connection string from Azure Portal

## Step 8: Running the Application

### Development Mode:
```bash
./mvnw compile quarkus:dev
```

### Production Build:
```bash
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar
```

### Using Docker:
```bash
./mvnw package -Pnative -Dquarkus.native.container-build=true
docker build -f src/main/docker/Dockerfile.native -t azure-upload .
docker run -i --rm -p 8080:8080 azure-upload
```

## Step 9: Testing

1. **Start the application:**
   ```bash
   ./mvnw compile quarkus:dev
   ```

2. **Open browser:**
   - Navigate to `http://localhost:8080/api/`
   - You'll see the upload form

3. **Test file upload:**
   - Select a file (image, PDF, etc.)
   - Click "Upload File"
   - Check Azure Storage for the uploaded file

## Features

✅ **Modern UI with Tailwind CSS**
- Responsive design
- Drag and drop support
- Real-time feedback
- Progress indicators

✅ **File Validation**
- File type restrictions
- Size limits (10MB)
- Client and server-side validation

✅ **Azure Integration**
- Secure blob storage
- Unique file naming
- Proper content type handling

✅ **Error Handling**
- Comprehensive error messages
- Graceful failure handling
- User-friendly feedback

## Security Considerations

- Store Azure connection string as environment variable in production
- Implement authentication/authorization as needed
- Consider file scanning for malware
- Set up CORS policies appropriately
- Use HTTPS in production

## Next Steps

- Add user authentication
- Implement file management (list, delete)
- Add file thumbnails for images
- Set up automated testing
- Configure monitoring and logging

Or, if you don't have GraalVM installed, you can run the native executable build in a container using:

```shell script
./mvnw package -Dnative -Dquarkus.native.container-build=true
```

You can then execute your native executable with: `./target/upload-1.0.0-SNAPSHOT-runner`

If you want to learn more about building native executables, please consult <https://quarkus.io/guides/maven-tooling>.

## Provided Code

### REST

Easily start your REST Web Services

[Related guide section...](https://quarkus.io/guides/getting-started-reactive#reactive-jax-rs-resources)
