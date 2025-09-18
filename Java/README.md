# Java 
This directory contains lessons, code, and examples for Java. 
 
## Topics 
- Basics 
- Spring Boot 
- Testing 
- Concurrency 
- Data Persistence 
- Microservices 
- Deployment 

---

# Core containers & orchestration

* **Docker**

  * *Use:* Build/run portable app images.
  * *Create/Run:*

    ```bash
    docker build -t demoapp-frontend ./web-ui
    docker run --rm -p 3000:80 demoapp-frontend
    docker images
    docker ps -a
    ```
* **Docker Compose (v3.8)**

  * *Use:* Orchestrate all services with one file.
  * *Run/Stop/Clean:*

    ```bash
    docker compose up --build        # foreground
    docker compose up -d             # detached
    docker compose logs -f backend   # tail logs for one service
    docker compose down -v           # stop + remove volumes
    ```
* **Docker networks & volumes**

  * *Use:* Service discovery & persistence.
  * *Create/Inspect:*

    ```bash
    docker network create demoapp-network
    docker volume create demoapp-pg-data
    docker network inspect demoapp-network
    docker volume inspect demoapp-pg-data
    ```

---

# Frontend

* **Node.js & npm (builder stage)**

  * *Use:* Build SPA assets for Nginx to serve.
  * *Project & Build:*

    ```bash
    # inside ./web-ui
    npm init -y
    npm install
    npm run build
    ```
* **(Optional) Vite + React scaffold**

  * *Use:* Fast dev/build DX for SPA.
  * *Create app:*

    ```bash
    npm create vite@latest web-ui -- --template react-ts
    cd web-ui && npm i && npm run dev
    ```
* **Nginx**

  * *Use:* Serve SPA; reverse proxy to backend; set CSP.
  * *Run/Reload/Test:*

    ```bash
    docker build -t demoapp-nginx ./nginx
    docker run -p 80:8080 demoapp-nginx
    # inside container or image build:
    nginx -t && nginx -s reload
    ```

---

# Backend (Java/Spring)

* **OpenJDK (17/21)**

  * *Use:* Runtime for Spring Boot app.
  * *Check version / run JAR:*

    ```bash
    java -version
    java -jar build/libs/app.jar
    ```
* **Spring Boot**

  * *Use:* REST APIs, config, embedded server, Actuator.
  * *Create starter (Maven):*

    ```bash
    # Using Spring Initializr via curl (example)
    curl https://start.spring.io/starter.zip \
      -d dependencies=web,data-jpa,security,oauth2-resource-server,actuator \
      -d javaVersion=21 -d packaging=jar -d name=demoapp-backend -o backend.zip
    unzip backend.zip -d api-server
    ```
* **Maven (build tool)**

  * *Use:* Build, test, package, run migrations.
  * *Common:*

    ```bash
    mvn clean verify
    mvn spring-boot:run
    mvn -DskipTests package
    mvn dependency:tree
    ```
  * *Add deps (edit `pom.xml`):* add starters like `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, etc., then `mvn clean install`.
* **(Alt) Gradle**

  * *Use:* Alternative build tool.
  * *Common:*

    ```bash
    ./gradlew clean build
    ./gradlew bootRun
    ```

---

# Data layer

* **PostgreSQL + PostGIS**

  * *Use:* Relational + geospatial storage.
  * *Run & connect:*

    ```bash
    docker run --name demoapp-db -e POSTGRES_PASSWORD=postgres \
      -p 5432:5432 -d postgis/postgis:16-3.4
    psql "postgresql://postgres:postgres@localhost:5432/postgres" -c "CREATE EXTENSION postgis;"
    ```
* **pgAdmin 4**

  * *Use:* Browser-based DB admin.
  * *Run & login:*

    ```bash
    docker run -d --name demoapp-pgadmin -p 8083:80 \
      -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
      -e PGADMIN_DEFAULT_PASSWORD=secret dpage/pgadmin4
    ```

---

# Identity & access

* **Keycloak (25.x)**

  * *Use:* OIDC/SAML auth, users, realms, roles.
  * *Dev run (import realm):*

    ```bash
    docker run --name demoapp-keycloak -p 8081:8080 \
      -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
      -v "$PWD/keycloak/import:/opt/keycloak/data/import" \
      quay.io/keycloak/keycloak:25.0.4 start-dev --import-realm
    ```
  * *CLI (inside container) create client/user (example):*

    ```bash
    /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8081 \
      --realm master --user admin --password admin
    /opt/keycloak/bin/kcadm.sh create users -r myrealm -s username=demo -s enabled=true
    ```
* **Spring Security + OAuth2 Resource Server**

  * *Use:* Validate JWTs from Keycloak; protect APIs.
  * *Add (Maven):* `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`
  * *Enable (application.yml snippet):*

    ```yaml
    spring:
      security:
        oauth2:
          resourceserver:
            jwt:
              issuer-uri: http://demoapp-keycloak:8080/realms/myrealm
    ```

---

# Cloud emulation & storage

* **LocalStack (S3)**

  * *Use:* Emulate AWS locally (S3, etc.) on :4566.
  * *Run:*

    ```bash
    docker run -d --name demoapp-localstack -p 4566:4566 \
      -e SERVICES=s3 -e DEBUG=1 -v /var/run/docker.sock:/var/run/docker.sock \
      localstack/localstack:2
    ```
* **AWS CLI (against LocalStack)**

  * *Use:* Create buckets, upload/list objects.
  * *Profile & bucket:*

    ```bash
    aws configure --profile localstack
    aws --profile localstack --endpoint-url http://localhost:4566 s3 mb s3://demoapp-bucket
    aws --profile localstack --endpoint-url http://localhost:4566 s3 cp file.pdf s3://demoapp-bucket/docs/file.pdf
    aws --profile localstack --endpoint-url http://localhost:4566 s3 ls s3://demoapp-bucket
    ```

---

# DB migrations & schema

* **Liquibase**

  * *Use:* Versioned DB schema changes.
  * *Init & run:*

    ```bash
    # in backend repo
    liquibase init project
    liquibase status
    liquibase update
    ```
  * *Spring Boot integration:* include `liquibase-core` and set `spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yaml`.

---

# API docs & testing

* **springdoc-openapi (Swagger UI)**

  * *Use:* Interactive API docs at runtime.
  * *Add (Maven):* `org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0`
  * *Access:* `http://localhost:8080/swagger-ui.html`
* **Testcontainers**

  * *Use:* Spin up disposable Postgres/LocalStack for integration tests.
  * *Run tests:*

    ```bash
    mvn -Dtest=*IT verify
    ```
* **REST Assured**

  * *Use:* Declarative HTTP API tests.
  * *Run tests:* included in `mvn test`.

---

# Document processing toolchain (if used by backend)

* **Apache PDFBox**

  * *Use:* Parse/render PDFs.
  * *Add (Maven):* `org.apache.pdfbox:pdfbox:3.0.3`
* **Tesseract OCR (+ Tess4J binding)**

  * *Use:* OCR scans -> text.
  * *Install OCR engine (Debian/Ubuntu base):*

    ```bash
    apt-get update && apt-get install -y tesseract-ocr
    ```
  * *Add (Maven):* `net.sourceforge.tess4j:tess4j:5.13.0`
* **Apache Tika**

  * *Use:* Detect file types & extract text/metadata.
  * *Add (Maven):* `org.apache.tika:tika-core:3.1.0`

---

# Quality & ergonomics libs

* **Lombok**

  * *Use:* Reduce boilerplate (`@Data`, `@Builder`).
  * *Add (Maven):*

    ```xml
    <dependency>
      <groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><version>1.18.32</version><scope>provided</scope>
    </dependency>
    ```
* **ModelMapper**

  * *Use:* DTO ↔ entity mapping.
  * *Add (Maven):* `org.modelmapper:modelmapper:3.2.0`
* **Spring Boot Actuator**

  * *Use:* Health/metrics endpoints.
  * *Add (Maven):* `spring-boot-starter-actuator`
  * *Hit health:* `curl http://localhost:8080/actuator/health`

---

# Reverse proxy & security headers

* **Nginx reverse proxy + CSP**

  * *Use:* Route `/api` to backend, serve SPA, set CSP.
  * *Minimal proxy (snippet in nginx.conf):*

    ```nginx
    server {
      listen 8080;
      add_header Content-Security-Policy "$CSP_HOSTS";
      location / { root /usr/share/nginx/html; try_files $uri /index.html; }
      location /api/ { proxy_pass http://demoapp-backend:8080/; }
    }
    ```

---

# Custom GuardDuty-style emulator (dev)

* **[Amazon GuardDuty](https://docs.aws.amazon.com/guardduty/)** is a continuous security monitoring service. Amazon GuardDuty can help to identify unexpected and potentially unauthorized or malicious activity in your AWS environment.

  * *Use:* Poll S3 for new objects, “scan”, then tag (e.g., `NO_THREATS_FOUND`).
  * *Run (example Python entrypoint):*

    ```bash
    # inside ./guard-duty-emulation
    pip install boto3
    python guardduty_emulator.py --endpoint http://demoapp-localstack:4566 --bucket demoapp-bucket --interval 3
    ```

---

# Env & health

* **.env files**

  * *Use:* Centralize secrets/config used by compose & apps.
  * *Load automatically by compose:* `env_file: .env`
* **Compose healthchecks**

  * *Use:* Gate dependent services until ready.
  * *Example (Keycloak):*

    ```yaml
    healthcheck:
      test: ["CMD", "bash", "-c", "exec 3<>/dev/tcp/localhost/8080"]
      interval: 10s
      retries: 10
    ```

---

## Common “wire-up” snippets

* **Backend → Postgres (JPA)** (`application.yml`)

  ```yaml
  spring:
    datasource:
      url: jdbc:postgresql://demoapp-db:5432/demoapp
      username: ${POSTGRES_USER}
      password: ${POSTGRES_PASSWORD}
    jpa:
      hibernate:
        ddl-auto: validate
      properties:
        hibernate.dialect: org.hibernate.spatial.dialect.postgis.PostgisPG10Dialect
  ```
* **Backend → S3 (LocalStack)** (env)

  ```bash
  AWS_ACCESS_KEY_ID=test
  AWS_SECRET_ACCESS_KEY=test
  AWS_REGION=us-east-1
  S3_ENDPOINT=http://demoapp-localstack:4566
  ```
* **Frontend → Backend API base**

  ```bash
  # web-ui/.env
  VITE_API_URL=http://localhost:8080
  ```

