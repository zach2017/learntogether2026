import requests
import zipfile
import io
import os
import argparse

# --- Configuration ---
INITIALIZR_URL = "https://start.spring.io/starter.zip"

def generate_and_extract_spring_boot_project(url, params, output_dir):
    """
    Makes an API request to Spring Initializr, downloads the ZIP, and extracts it.
    """
    print(f"🚀 Requesting project from {url}...")
    print(f"   - Project Name: {params.get('name')}")
    print(f"   - Java Version: {params.get('javaVersion')}")
    print(f"   - Dependencies: {params.get('dependencies')}")
    print(f"   - Build Tool: {params.get('type')}")
    
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
            print("\nYour new Spring Boot project is ready to use!")
            
        else:
            print(f"❌ Failed to download project. HTTP Status Code: {response.status_code}")
            print("Error Details:\n", response.text)

    except requests.exceptions.RequestException as e:
        print(f"❌ An error occurred during the HTTP request: {e}")

def parse_arguments():
    """
    Parse command-line arguments for Spring Boot project generation.
    """
    parser = argparse.ArgumentParser(
        description='Generate a Spring Boot project using Spring Initializr API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Basic usage with defaults
  python %(prog)s
  
  # Custom project name and Java version
  python %(prog)s --name MyApp --java-version 17
  
  # With specific dependencies
  python %(prog)s --name MyAPI --dependencies web,lombok,jpa,h2
  
  # Gradle project with Kotlin
  python %(prog)s --type gradle-project --language kotlin --name KotlinApp
  
  # Full customization
  python %(prog)s --name MyService --group-id org.mycompany --artifact-id my-service \\
                 --java-version 21 --dependencies web,lombok,actuator --boot-version 3.2.0
        '''
    )
    
    # Project identification
    parser.add_argument('--name', 
                        default='Java21WebLombokApp',
                        help='Project name (default: Java21WebLombokApp)')
    
    parser.add_argument('--group-id', 
                        default='com.example',
                        help='Group ID for the project (default: com.example)')
    
    parser.add_argument('--artifact-id', 
                        help='Artifact ID (default: lowercase project name)')
    
    parser.add_argument('--package-name',
                        help='Base package name (default: groupId.artifactId)')
    
    parser.add_argument('--description',
                        help='Project description (default: auto-generated)')
    
    # Build configuration
    parser.add_argument('--type',
                        choices=['maven-project', 'gradle-project', 'gradle-project-kotlin'],
                        default='maven-project',
                        help='Project build tool (default: maven-project)')
    
    parser.add_argument('--language',
                        choices=['java', 'kotlin', 'groovy'],
                        default='java',
                        help='Programming language (default: java)')
    
    parser.add_argument('--java-version',
                        choices=['17', '21', '23'],
                        default='21',
                        help='Java version (default: 21)')
    
    parser.add_argument('--boot-version',
                        help='Spring Boot version (default: latest stable, e.g., 3.4.0)')
    
    # Dependencies
    parser.add_argument('--dependencies',
                        default='web,lombok',
                        help='Comma-separated list of dependencies (default: web,lombok). '
                             'Examples: web,lombok,jpa,h2,actuator,security,data-rest,validation')
    
    # Output configuration
    parser.add_argument('--output-dir',
                        help='Output directory (default: ./ProjectName)')
    
    parser.add_argument('--url',
                        default=INITIALIZR_URL,
                        help=f'Spring Initializr URL (default: {INITIALIZR_URL})')
    
    return parser.parse_args()

def build_params(args):
    """
    Build the parameters dictionary from command-line arguments.
    """
    # Use artifact-id if provided, otherwise use lowercase project name
    artifact_id = args.artifact_id if args.artifact_id else args.name.lower()
    
    # Use package-name if provided, otherwise construct from group-id and artifact-id
    package_name = args.package_name if args.package_name else f"{args.group_id}.{artifact_id.replace('-', '')}"
    
    # Use description if provided, otherwise auto-generate
    description = args.description if args.description else f"Spring Boot project: {args.name}"
    
    params = {
        'type': args.type,
        'language': args.language,
        'groupId': args.group_id,
        'artifactId': artifact_id,
        'name': args.name,
        'description': description,
        'packageName': package_name,
        'javaVersion': args.java_version,
        'dependencies': args.dependencies
    }
    
    # Add bootVersion only if specified
    if args.boot_version:
        params['bootVersion'] = args.boot_version
    
    return params

if __name__ == "__main__":
    # Parse command-line arguments
    args = parse_arguments()
    
    # Build parameters dictionary
    params = build_params(args)
    
    # Determine output directory
    output_dir = args.output_dir if args.output_dir else f"./{args.name}"
    
    # Generate and extract the project
    generate_and_extract_spring_boot_project(args.url, params, output_dir)