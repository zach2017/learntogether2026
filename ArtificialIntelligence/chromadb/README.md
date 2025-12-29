TODO:

https://docs.langchain.com/oss/python/langgraph/agentic-rag#4-grade-documents

* Java Spring Boot **API** (uploads → S3, metadata → Postgres, message → SQS)
* Java Spring Boot **Worker** (polls SQS → fetches S3 → gets embeddings from **Ollama** → upserts into **ChromaDB**)
* **LocalStack** (S3 + SQS; GuardDuty is stubbed—see note)
* **Postgres** (“progress db” per your note) + simple schema
* **ChromaDB** server
* **Nginx** reverse proxy (one front door)
* **Ollama** (for embeddings; set to pull a small embed model)

> ⚠️ GuardDuty is a managed AWS threat-detection service and isn’t functionally emulated in LocalStack Community. The compose below creates a **placeholder** “guardduty” container (no-op) so your topology stays consistent. If you have LocalStack Pro, you can wire any additional mocks you need.

---

# docker-compose.yml

```yaml
version: "3.9"

x-env: &aws_env
  AWS_ACCESS_KEY_ID: test
  AWS_SECRET_ACCESS_KEY: test
  AWS_DEFAULT_REGION: us-east-1

services:
  reverse-proxy:
    image: nginx:1.27-alpine
    depends_on:
      - api
      - chroma
      - ollama
    ports: ["80:80"]
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks: [ appnet ]

  api:
    build: ./services/java-api
    environment:
      <<: *aws_env
      S3_BUCKET_NAME: doc-uploads
      SQS_QUEUE_NAME: doc-queue
      AWS_ENDPOINT: http://localstack:4566
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/appdb
      SPRING_DATASOURCE_USERNAME: app
      SPRING_DATASOURCE_PASSWORD: app
      SERVER_PORT: "8080"
    depends_on:
      localstack:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks: [ appnet ]

  worker:
    build: ./services/java-worker
    environment:
      <<: *aws_env
      S3_BUCKET_NAME: doc-uploads
      SQS_QUEUE_NAME: doc-queue
      AWS_ENDPOINT: http://localstack:4566
      CHROMA_URL: http://chroma:8000
      OLLAMA_URL: http://ollama:11434
    depends_on:
      localstack:
        condition: service_healthy
      chroma:
        condition: service_started
      ollama:
        condition: service_healthy
    networks: [ appnet ]

  localstack:
    image: localstack/localstack:3
    environment:
      - SERVICES=s3,sqs
      - DEBUG=0
      - PERSIST=1
      - DOCKER_HOST=unix:///var/run/docker.sock
    ports:
      - "4566:4566"
    volumes:
      - "localstack_data:/var/lib/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./infra/localstack/init:/etc/localstack/init/ready.d" # bootstrap S3/SQS
    healthcheck:
      test: ["CMD", "bash", "-c", "awslocal s3 ls >/dev/null 2>&1 || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [ appnet ]

  guardduty:
    image: alpine:3.20
    command: ["/bin/sh","-c","echo 'GuardDuty placeholder for local dev'; tail -f /dev/null"]
    networks: [ appnet ]

  chroma:
    image: chromadb/chroma:latest
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
    ports: ["8000:8000"]
    volumes:
      - chroma_data:/chroma
    networks: [ appnet ]

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=app
      - POSTGRES_DB=appdb
    ports: ["5432:5432"]
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/00_init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [ appnet ]

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes:
      - ollama_data:/root/.ollama
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:11434/api/tags >/dev/null"]
      interval: 5s
      timeout: 3s
      retries: 60
    entrypoint: ["/bin/sh","-lc"]
    command: >
      "
      /bin/ollama serve &
      until curl -sf http://localhost:11434/api/tags >/dev/null; do sleep 1; done;
      # pull a small embedding model for speed
      ollama pull nomic-embed-text
      wait -n
      "
    networks: [ appnet ]

networks:
  appnet: {}

volumes:
  localstack_data:
  chroma_data:
  pg_data:
  ollama_data:
```

---

## Nginx (reverse proxy)

**infra/nginx/nginx.conf**

```nginx
worker_processes  1;
events { worker_connections 1024; }
http {
  sendfile on;
  server {
    listen 80;

    # Frontend/static from API
    location / {
      proxy_pass http://api:8080/;
      proxy_set_header Host $host;
    }

    # Explicit API path
    location /api/ {
      proxy_pass http://api:8080/api/;
      proxy_set_header Host $host;
    }

    # Chroma (optional route)
    location /chroma/ {
      proxy_pass http://chroma:8000/;
    }

    # Ollama (optional route)
    location /ollama/ {
      proxy_pass http://ollama:11434/;
    }
  }
}
```

---

## LocalStack bootstrap (create bucket + queue)

**infra/localstack/init/10-bootstrap.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

awslocal s3 mb s3://doc-uploads || true
awslocal sqs create-queue --queue-name doc-queue || true

echo "[localstack] ready: s3://doc-uploads and sqs://doc-queue"
```

Make it executable: `chmod +x infra/localstack/init/10-bootstrap.sh`

---

## Postgres schema

**infra/postgres/init.sql**

```sql
create table if not exists documents (
  id uuid primary key,
  filename text not null,
  s3_key text not null,
  content_type text,
  size_bytes bigint,
  uploaded_at timestamptz default now()
);

create index if not exists idx_documents_uploaded_at on documents(uploaded_at);
```

---

# Java API service (Spring Boot)

**services/java-api/pom.xml**

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>java-api</artifactId>
  <version>0.0.1</version>
  <properties>
    <java.version>21</java.version>
    <spring.boot.version>3.3.4</spring.boot.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring.boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId><artifactId>postgresql</artifactId>
    </dependency>
    <!-- AWS SDK v2 -->
    <dependency>
      <groupId>software.amazon.awssdk</groupId><artifactId>s3</artifactId>
    </dependency>
    <dependency>
      <groupId>software.amazon.awssdk</groupId><artifactId>sqs</artifactId>
    </dependency>
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId><artifactId>jackson-databind</artifactId>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

**services/java-api/src/main/resources/application.yml**

```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

app:
  awsEndpoint: ${AWS_ENDPOINT:http://localhost:4566}
  s3Bucket: ${S3_BUCKET_NAME:doc-uploads}
  sqsQueue: ${SQS_QUEUE_NAME:doc-queue}
```

**services/java-api/src/main/java/com/example/api/AwsConfig.java**

```java
package com.example.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

@Configuration
public class AwsConfig {

  @Value("${app.awsEndpoint}") private String endpoint;

  private StaticCredentialsProvider creds() {
    return StaticCredentialsProvider.create(AwsBasicCredentials.create("test","test"));
  }

  @Bean
  S3Client s3Client() {
    return S3Client.builder()
      .endpointOverride(URI.create(endpoint))
      .credentialsProvider(creds())
      .region(Region.US_EAST_1)
      .httpClientBuilder(UrlConnectionHttpClient.builder())
      .overrideConfiguration(ClientOverrideConfiguration.builder().build())
      .build();
  }

  @Bean
  SqsClient sqsClient() {
    return SqsClient.builder()
      .endpointOverride(URI.create(endpoint))
      .credentialsProvider(creds())
      .region(Region.US_EAST_1)
      .httpClientBuilder(UrlConnectionHttpClient.builder())
      .build();
  }
}
```

**services/java-api/src/main/java/com/example/api/DocumentController.java**

```java
package com.example.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.GetQueueUrlRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Controller
@RequiredArgsConstructor
public class DocumentController {
  private final S3Client s3;
  private final SqsClient sqs;
  private final ObjectMapper om = new ObjectMapper();
  private final JdbcTemplate jdbc;
  private final AppProps props;

  @GetMapping("/")
  public String index(Model model) { return "index"; }

  @PostMapping("/api/upload")
  @ResponseBody
  public Map<String,Object> upload(@RequestParam("files") MultipartFile[] files) throws Exception {
    String queueUrl = sqs.getQueueUrl(GetQueueUrlRequest.builder()
        .queueName(props.sqsQueue()).build()).queueUrl();

    List<Map<String,String>> sent = new ArrayList<>();

    for (MultipartFile f : files) {
      UUID id = UUID.randomUUID();
      String key = "uploads/" + id + "-" + Objects.requireNonNullElse(f.getOriginalFilename(),"file");

      // S3 put
      s3.putObject(PutObjectRequest.builder()
              .bucket(props.s3Bucket())
              .key(key)
              .contentType(f.getContentType())
              .build(),
          software.amazon.awssdk.core.sync.RequestBody.fromBytes(f.getBytes()));

      // DB metadata
      jdbc.update("""
          insert into documents(id, filename, s3_key, content_type, size_bytes, uploaded_at)
          values(?,?,?,?,?, now())
        """, id, f.getOriginalFilename(), key, f.getContentType(), f.getSize());

      // SQS message
      Map<String,Object> payload = Map.of(
          "id", id.toString(),
          "s3Key", key,
          "filename", f.getOriginalFilename(),
          "contentType", f.getContentType(),
          "sizeBytes", f.getSize(),
          "uploadedAt", Instant.now().toString()
      );
      sqs.sendMessage(SendMessageRequest.builder()
          .queueUrl(queueUrl)
          .messageBody(om.writeValueAsString(payload))
          .build());

      sent.add(Map.of("id", id.toString(), "s3Key", key));
    }

    return Map.of("status","OK","count", files.length, "items", sent);
  }
}
```

**services/java-api/src/main/java/com/example/api/AppProps.java**

```java
package com.example.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public record AppProps(
    @Value("${app.s3Bucket}") String s3Bucket,
    @Value("${app.sqsQueue}") String sqsQueue
) {}
```

**services/java-api/src/main/resources/templates/index.html**
(Static page with Tailwind, multiple file upload)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Fancy Uploader</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
  <div class="max-w-3xl mx-auto py-14 px-6">
    <div class="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8">
      <h1 class="text-3xl font-extrabold text-indigo-700 mb-2">Document Uploader</h1>
      <p class="text-gray-600 mb-6">Upload one or more files. We’ll store in S3, enqueue to SQS, and process embeddings to Chroma.</p>

      <form id="uploadForm" class="space-y-4">
        <div class="border-2 border-dashed rounded-xl p-6 text-center hover:border-indigo-400 transition">
          <input id="files" name="files" type="file" multiple class="hidden" />
          <label for="files" class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-medium hover:scale-105 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4v9m0 0l3-3m-3 3l-3-3M4 20h16"/></svg>
            Choose files
          </label>
          <p id="fileList" class="mt-3 text-sm text-gray-500"></p>
        </div>

        <button type="submit" class="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition">
          Upload
        </button>
      </form>

      <pre id="result" class="mt-6 text-sm bg-gray-900 text-green-200 p-4 rounded-xl overflow-auto"></pre>
    </div>
  </div>

<script>
  const filesInput = document.getElementById('files');
  const fileList = document.getElementById('fileList');
  filesInput.addEventListener('change', () => {
    fileList.textContent = [...filesInput.files].map(f => f.name).join(', ');
  });

  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    [...filesInput.files].forEach(f => fd.append('files', f));

    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    document.getElementById('result').textContent = JSON.stringify(json, null, 2);
  });
</script>
</body>
</html>
```

**services/java-api/Dockerfile**

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

---

# Java Worker service (Spring Boot)

**services/java-worker/pom.xml**

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>java-worker</artifactId>
  <version>0.0.1</version>
  <properties>
    <java.version>21</java.version>
    <spring.boot.version>3.3.4</spring.boot.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring.boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
      <groupId>software.amazon.awssdk</groupId><artifactId>s3</artifactId>
    </dependency>
    <dependency>
      <groupId>software.amazon.awssdk</groupId><artifactId>sqs</artifactId>
    </dependency>
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId><artifactId>jackson-databind</artifactId>
    </dependency>
    <dependency>
      <groupId>org.apache.httpcomponents.client5</groupId><artifactId>httpclient5</artifactId>
      <version>5.3.1</version>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```

**services/java-worker/src/main/resources/application.yml**

```yaml
app:
  awsEndpoint: ${AWS_ENDPOINT:http://localhost:4566}
  s3Bucket: ${S3_BUCKET_NAME:doc-uploads}
  sqsQueue: ${SQS_QUEUE_NAME:doc-queue}
  chromaUrl: ${CHROMA_URL:http://localhost:8000}
  ollamaUrl: ${OLLAMA_URL:http://localhost:11434}
```

**services/java-worker/src/main/java/com/example/worker/WorkerApp.java**

```java
package com.example.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WorkerApp {
  public static void main(String[] args) { SpringApplication.run(WorkerApp.class, args); }
}
```

**services/java-worker/src/main/java/com/example/worker/AwsBeans.java**

```java
package com.example.worker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sqs.SqsClient;

import java.net.URI;

@Configuration
public class AwsBeans {
  @Value("${app.awsEndpoint}") String endpoint;

  private StaticCredentialsProvider creds() {
    return StaticCredentialsProvider.create(AwsBasicCredentials.create("test","test"));
  }

  @Bean S3Client s3() {
    return S3Client.builder()
      .endpointOverride(URI.create(endpoint))
      .credentialsProvider(creds())
      .region(Region.US_EAST_1)
      .httpClientBuilder(UrlConnectionHttpClient.builder())
      .build();
  }

  @Bean SqsClient sqs() {
    return SqsClient.builder()
      .endpointOverride(URI.create(endpoint))
      .credentialsProvider(creds())
      .region(Region.US_EAST_1)
      .httpClientBuilder(UrlConnectionHttpClient.builder())
      .build();
  }
}
```

**services/java-worker/src/main/java/com/example/worker/QueuePoller.java**

```java
package com.example.worker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class QueuePoller {

  private final SqsClient sqs;
  private final S3Client s3;
  private final ObjectMapper om = new ObjectMapper();

  @Value("${app.sqsQueue}") String queueName;
  @Value("${app.s3Bucket}") String bucket;
  @Value("${app.chromaUrl}") String chromaUrl;
  @Value("${app.ollamaUrl}") String ollamaUrl;

  private String queueUrl;

  @EventListener(ApplicationReadyEvent.class)
  public void init() {
    queueUrl = sqs.getQueueUrl(GetQueueUrlRequest.builder().queueName(queueName).build()).queueUrl();
    ensureChromaCollection("documents");
  }

  @Scheduled(fixedDelay = 2000)
  public void poll() throws Exception {
    ReceiveMessageResponse resp = sqs.receiveMessage(ReceiveMessageRequest.builder()
        .queueUrl(queueUrl).maxNumberOfMessages(5).waitTimeSeconds(2).build());

    for (Message m : resp.messages()) {
      try {
        process(m.body());
        sqs.deleteMessage(DeleteMessageRequest.builder()
            .queueUrl(queueUrl).receiptHandle(m.receiptHandle()).build());
      } catch (Exception e) {
        log.error("Processing failed; leaving message for retry", e);
      }
    }
  }

  private void process(String body) throws Exception {
    JsonNode j = om.readTree(body);
    String s3Key = j.get("s3Key").asText();
    String id = j.get("id").asText();
    String filename = j.path("filename").asText("");

    // Get object from S3 (assume text; extend with Tika for PDFs, etc.)
    GetObjectRequest req = GetObjectRequest.builder().bucket(bucket).key(s3Key).build();
    try (InputStream in = s3.getObject(req)) {
      String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);

      // Embedding via Ollama
      float[] embedding = embed(text);

      // Upsert to Chroma (collection 'documents')
      upsertToChroma("documents", id, text, Map.of("filename", filename, "s3Key", s3Key), embedding);

      log.info("Upserted {} ({} bytes) to Chroma", id, text.length());
    }
  }

  private float[] embed(String text) throws Exception {
    try (CloseableHttpClient http = HttpClients.createDefault()) {
      HttpPost post = new HttpPost(ollamaUrl + "/api/embeddings");
      post.setHeader("Content-Type","application/json");
      post.setEntity(new StringEntity(om.writeValueAsString(Map.of(
          "model","nomic-embed-text",
          "prompt", text
      ))));
      var resp = http.execute(post);
      var node = om.readTree(resp.getEntity().getContent());
      var arr = node.get("embedding");
      float[] out = new float[arr.size()];
      for (int i=0;i<arr.size();i++) out[i] = (float) arr.get(i).asDouble();
      return out;
    }
  }

  private void ensureChromaCollection(String name) {
    try (CloseableHttpClient http = HttpClients.createDefault()) {
      // try get by name; if not, create
      var get = new HttpGet(chromaUrl + "/api/v1/collections?name=" + name);
      var resp = http.execute(get);
      var node = om.readTree(resp.getEntity().getContent());
      if (node.path("ids").isEmpty() || node.path("ids").size()==0) {
        HttpPost post = new HttpPost(chromaUrl + "/api/v1/collections");
        post.setHeader("Content-Type","application/json");
        post.setEntity(new StringEntity(om.writeValueAsString(Map.of("name", name))));
        http.execute(post).close();
      }
    } catch (Exception e) {
      // best-effort; collection will be auto-created on first add in recent versions
    }
  }

  private void upsertToChroma(String collection, String id, String doc, Map<String,String> meta, float[] embedding) throws Exception {
    try (CloseableHttpClient http = HttpClients.createDefault()) {
      HttpPost post = new HttpPost(chromaUrl + "/api/v1/collections/" + collection + "/add");
      post.setHeader("Content-Type","application/json");
      var payload = Map.of(
          "ids", List.of(id),
          "documents", List.of(doc),
          "metadatas", List.of(meta),
          "embeddings", List.of(embedding)
      );
      post.setEntity(new StringEntity(om.writeValueAsString(payload)));
      http.execute(post).close();
    }
  }
}
```

**services/java-worker/Dockerfile**

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

---

## Project layout (suggested)

```
.
├─ docker-compose.yml
├─ infra/
│  ├─ nginx/nginx.conf
│  ├─ localstack/init/10-bootstrap.sh
│  └─ postgres/init.sql
├─ services/
│  ├─ java-api/
│  │  ├─ pom.xml
│  │  ├─ Dockerfile
│  │  └─ src/...
│  └─ java-worker/
│     ├─ pom.xml
│     ├─ Dockerfile
│     └─ src/...
```

---

## How to run

```bash
docker compose up -d --build
# open http://localhost  → fancy Tailwind uploader
# Chroma API at         → http://localhost/chroma/
# Ollama API at         → http://localhost/ollama/
```

**Test it quickly**

```bash
curl -F "files=@/etc/hosts" http://localhost/api/upload
```

Watch the worker logs process, embed, and upsert to Chroma:

```bash
docker compose logs -f worker
```

---

## Notes & next steps

* **GuardDuty**: For local dev, treat as non-functional placeholder. If you later wire detections, consider emitting “findings” into CloudWatch or S3 from a mock sidecar and surfacing them in the UI/logs.
* **File types**: Worker assumes text. Add Apache Tika to extract from PDFs/Word, chunk long docs, and generate multiple embeddings per chunk.
* **Search**: Add a tiny query endpoint (e.g., `/api/search?q=`) that calls Chroma `/query` and optionally re-ranks with an Ollama LLM.
* **Auth**: When you’re ready, drop Keycloak in and place Nginx in front of it, or keep the current reverse proxy and protect `/api/*`.

