import requests
import zipfile
import io
import os

# --- Configuration ---
# The base URL for the Spring Initializr API
INITIALIZR_URL = "https://start.spring.io/starter.zip"
PROJECT_NAME = "Java21WebLombokApp"
DESTINATION_DIR = "./" + PROJECT_NAME # Save the project in a folder with its name

# Define the parameters for the project generation
params = {
    'type': 'maven-project',          # Project build tool: 'maven-project'
    'language': 'java',               # Programming language: 'java'
    'groupId': 'com.example',         # Group ID
    'artifactId': PROJECT_NAME.lower(), # Artifact ID (usually lowercase)
    'name': PROJECT_NAME,             # Project name
    'description': 'Spring Boot project with Java 21, Web, and Lombok.',
    'packageName': 'com.example.' + PROJECT_NAME.lower(), # Base package name
    'javaVersion': '21',              # <--- SPECIFIED: Java 21
    'dependencies': 'web,lombok'      # <--- SPECIFIED: Spring Web and Lombok
    # The 'bootVersion' is omitted, which selects the latest stable version (e.g., 4.0.0)
}

def generate_and_extract_spring_boot_project(url, params, output_dir):
    """
    Makes an API request to Spring Initializr, downloads the ZIP, and extracts it.
    """
    print(f"🚀 Requesting project from {url}...")
    print(f"   - Java Version: {params.get('javaVersion')}")
    print(f"   - Dependencies: {params.get('dependencies')}")
    
    try:
        # Make the GET request
        response = requests.get(url, params=params)
        
        # Check if the request was successful (HTTP status code 200)
        if response.status_code == 200:
            print("✅ Successfully downloaded project ZIP.")
            
            # Use io.BytesIO to treat the response content as a file in memory
            zip_file = zipfile.ZipFile(io.BytesIO(response.content))
            
            # Create the destination directory if it doesn't exist
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Extract the contents to the destination directory
            zip_file.extractall(output_dir)
            print(f"📂 Project extracted successfully to: **{output_dir}**") 
            print("\nYour new Maven project is ready to use!")
            
        else:
            print(f"❌ Failed to download project. HTTP Status Code: {response.status_code}")
            print("Error Details:\n", response.text)

    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the HTTP request: {e}")

if __name__ == "__main__":
    generate_and_extract_spring_boot_project(INITIALIZR_URL, params, DESTINATION_DIR)