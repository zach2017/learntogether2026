### Java Microservice (Spring Boot) for S3 File Upload

#### Setup
- Add dependencies: `spring-boot-starter-web`, `aws-java-sdk-s3`, `spring-boot-starter-security`.
- `application.properties`:
  ```
  aws.s3.bucketName=your-bucket
  aws.s3.accessKey=your-key
  aws.s3.secretKey=your-secret
  ```

#### Controller
```java
@RestController
@RequestMapping("/api/s3")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('UPLOADER')")  // RBAC limit
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        fileService.uploadFile(file);
        return ResponseEntity.ok("Uploaded");
    }
}
```


#### Service
```java
@Service
public class FileService {
    private AmazonS3 s3Client;
    @Value("${aws.s3.bucketName}") private String bucket;

    @PostConstruct
    private void init() {
        // Init S3 client with credentials
        s3Client = AmazonS3ClientBuilder.standard()
            .withCredentials(new DefaultAWSCredentialsProviderChain())
            .build();
    }

    public void uploadFile(MultipartFile file) {
        s3Client.putObject(bucket, file.getOriginalFilename(), file.getInputStream(), new ObjectMetadata());
    }
}
```

#### Security (RBAC)
- Define roles in enum: `USER`, `UPLOADER`.
- Security Config:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests()
            .requestMatchers("/api/s3/upload").hasRole("UPLOADER")
            .anyRequest().authenticated();
        return http.build();
    }
}
```
- Use JWT or basic auth for user roles.

#### Dockerize
Dockerfile:
```
FROM openjdk:17-jdk-alpine
COPY target/your-app.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```
Build: `docker build -t your-app .`
Run: `docker run -p 8080:8080 your-app`

#### OpenStack Deployment
Deploy Docker image on OpenStack VM via Horizon; install Docker, pull/run image.

#### Clients
- **Python**:
```python
import requests
files = {'file': open('file.txt', 'rb')}
requests.post('http://localhost:8080/api/s3/upload', files=files, headers={'Authorization': 'Bearer token'})
```

- **Java (RestTemplate)**:
```java
RestTemplate rest = new RestTemplate();
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.MULTIPART_FORM_DATA);
MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
body.add("file", new FileSystemResource("file.txt"));
HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);
rest.postForObject("http://localhost:8080/api/s3/upload", entity, String.class);
```

- **JS/React**:
```jsx
const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  fetch('/api/s3/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': 'Bearer token' }
  });
};
```

### OAuth2 Security for Microservice

#### Overview
Use OAuth2 for authorization. Microservice acts as Resource Server. Clients obtain access tokens from Authorization Server (e.g., Auth0, Keycloak).

#### Configuration (Spring Boot)
- Add dependency: `spring-boot-starter-oauth2-resource-server`.
- `application.properties`:
  ```
  spring.security.oauth2.resourceserver.jwt.issuer-uri=https://your-auth-server
  ```
- Security Config:
  ```java
  @Configuration
  @EnableWebSecurity
  @EnableMethodSecurity
  public class SecurityConfig {
      @Bean
      public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
          http.oauth2ResourceServer().jwt();
          http.authorizeHttpRequests()
              .requestMatchers("/api/s3/upload").hasAuthority("SCOPE_upload")  // Use scopes or roles from JWT
              .anyRequest().authenticated();
          return http.build();
      }
  }
  ```
- `@PreAuthorize("hasAuthority('SCOPE_upload')")` on endpoints.

#### Flow
1. Client authenticates with Auth Server, gets JWT access token with scopes/roles.
2. Client sends request with `Authorization: Bearer <token>`.
3. Microservice validates token signature, issuer, expiry; extracts claims for RBAC.
4. If valid and authorized, process request; else, 401/403.

#### Client Examples
- **Python**: Use `requests` with token from auth lib (e.g., authlib).
- **Java**: Use `RestTemplate` or WebClient with OAuth2 filter.
- **JS/React**: Use fetch with token from auth provider (e.g., react-oidc-context).

### Integrate Cognito for S3 Access

#### Cognito Setup
1. Create User Pool in AWS Cognito.
2. Add App Client (enable OAuth2 flows).
3. Create Identity Pool; link User Pool.
4. Set IAM roles for authenticated users with S3 putObject policy on bucket.

#### Update Spring Boot
- Dependencies: `aws-java-sdk-cognitoidentity`, `aws-java-sdk-s3`.
- SecurityConfig: Set `spring.security.oauth2.resourceserver.jwt.issuer-uri` to Cognito User Pool.
- FileService:
```java
@Service
public class FileService {
    @Value("${aws.cognito.identityPoolId}") private String identityPoolId;
    @Value("${aws.region}") private String region;

    public void uploadFile(MultipartFile file, String idToken) {  // Pass ID token from auth
        AmazonCognitoIdentity identityClient = AmazonCognitoIdentityClientBuilder.standard()
            .withRegion(region).build();

        GetIdRequest idRequest = new GetIdRequest().withIdentityPoolId(identityPoolId)
            .withLogins(ImmutableMap.of("cognito-idp." + region + ".amazonaws.com/" + userPoolId, idToken));
        String identityId = identityClient.getId(idRequest).getIdentityId();

        GetCredentialsForIdentityRequest credsRequest = new GetCredentialsForIdentityRequest()
            .withIdentityId(identityId).withLogins(idRequest.getLogins());
        Credentials creds = identityClient.getCredentialsForIdentity(credsRequest).getCredentials();

        BasicSessionCredentials sessionCreds = new BasicSessionCredentials(
            creds.getAccessKeyId(), creds.getSecretKey(), creds.getSessionToken());

        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withCredentials(new AWSStaticCredentialsProvider(sessionCreds))
            .withRegion(region).build();

        s3Client.putObject(bucket, file.getOriginalFilename(), file.getInputStream(), new ObjectMetadata());
    }
}
```
- Controller: Extract ID token from `SecurityContextHolder` or request header; pass to service.

#### Add to OpenStack Demo
- Update `application.properties` with Cognito IDs.
- Rebuild JAR, Docker image.
- Deploy container on OpenStack VM as before.

#### Test on AWS
- Launch EC2 instance.
- Install Docker; pull/run image.
- Authenticate client with Cognito; send upload request with token.
- Verify file in S3 via AWS Console.