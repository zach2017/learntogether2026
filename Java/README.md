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
Below is a clean “what / why / how it fits” catalog for **demoapp**. Each heading is a technology or dependency; under it you’ll find a short description, key features, where it sits in the full stack, its dependencies, and how it helps simulate production locally with Docker + LocalStack.

---

# Containerization & Orchestration

## Docker

* **What:** Container runtime for packaging apps with all their dependencies.
* **Features:** Immutable images, layered filesystem, isolated FS/network/CPU/mem, fast rebuilds.
* **Full-stack fit:** Runs every component (frontend, backend, DBs, auth, tools) as containers.
* **Depends on:** Host OS + Docker Desktop (WSL2 on Windows).
* **Prod simulation:** Mirrors production container images and run parameters on your laptop.

## Docker Compose (v3.8)

* **What:** Multi-service orchestration via YAML.
* **Features:** Service graph (`depends_on`), networks, volumes, healthchecks, build contexts.
* **Full-stack fit:** One command to bring up frontend, backend, Postgres, Keycloak, Nginx, LocalStack, pgAdmin, and the GuardDuty emulator.
* **Depends on:** Docker (engine/CLI).
* **Prod simulation:** Simulates a micro-stack with realistic ports, env vars, and startup order.

## Docker Networks & Volumes

* **What:** Overlay networks for service discovery; volumes for persistent data.
* **Features:** DNS by service name, data survives container restarts.
* **Full-stack fit:** `demoapp-db`, `demoapp-keycloak`, etc. talk over the bridge network; volumes hold Postgres/pgAdmin data and shared static assets.
* **Depends on:** Docker daemon.
* **Prod simulation:** Models VPC-like networking and persistent disks.

---

# Frontend Layer

## Node.js (builder)

* **What:** JavaScript runtime used to build the SPA.
* **Features:** npm ecosystem, fast dev servers, tree-shaking bundlers.
* **Full-stack fit:** Builds the frontend artifacts (e.g., React+Vite) that Nginx serves.
* **Depends on:** Node base image in the multi-stage Dockerfile.
* **Prod simulation:** Reproducible builds within containers; same CI build uses same tooling.

## Vite + React (example SPA stack)

* **What:** Modern SPA tooling and UI library.
* **Features:** Lightning dev server (Vite), JSX/TSX (React), code splitting.
* **Full-stack fit:** Consumes `/api` from the backend, integrates OIDC login via Keycloak.
* **Depends on:** Node.js during build; Nginx at runtime.
* **Prod simulation:** Artifacts are static files served by Nginx like a real CDN/prod web tier.

## Nginx (static hosting & reverse proxy)

* **What:** High-performance web server/reverse proxy.
* **Features:** Efficient static serving, caching, gzip, proxying, CSP headers.
* **Full-stack fit:** Serves the SPA; proxies `/api/*` to `demoapp-backend`; can enforce CSP.
* **Depends on:** Built SPA assets; backend upstream.
* **Prod simulation:** Mirrors a typical edge/load-balancer layer in front of APIs and SPA.

---

# Backend Layer

## OpenJDK (17/21)

* **What:** Java runtime for the API.
* **Features:** Modern GC, records, virtual threads (21), strong TLS.
* **Full-stack fit:** Executes the Spring Boot fat JAR inside the backend container.
* **Depends on:** OS base (e.g., Alpine/Debian) in Docker image.
* **Prod simulation:** Same JVM version and flags as prod.

## Spring Boot

* **What:** Application framework for REST APIs.
* **Features:** Auto-config, dependency injection, embedded server, externalized config.
* **Full-stack fit:** Hosts controllers, services, repositories, security, and integrations.
* **Depends on:** Starters listed below; DB; Keycloak issuer; S3 endpoint.
* **Prod simulation:** Same `application.yml` wiring, ports (8080/8443), and health endpoints.

### Spring Web (spring-boot-starter-web)

* **What:** REST MVC for controllers and serialization.
* **Why:** Define `/api/*` endpoints that the SPA calls.
* **Fits:** Exposes JSON APIs; integrates with Spring Security.
* **Depends on:** Jackson for JSON.

### Spring Data JPA + Hibernate

* **What:** ORM & repository abstraction.
* **Why:** Map entities, write queries, and persist to Postgres/PostGIS.
* **Fits:** Data access layer, pagination, transactions.
* **Depends on:** JDBC driver, Hibernate, Postgres/PostGIS dialect.

### Spring Security + OAuth2 Resource Server

* **What:** AuthN/Z and JWT validation.
* **Why:** Protect APIs using Keycloak-issued tokens; role-based access.
* **Fits:** Security filter chain enforcing scopes/roles on endpoints.
* **Depends on:** Keycloak issuer/JWKS; Nimbus JOSE JWT.

### Liquibase

* **What:** Versioned DB migrations.
* **Why:** Declarative schema evolution across dev/test/prod.
* **Fits:** Runs on startup or via CLI to apply changelogs.
* **Depends on:** DB connectivity; changelog files.

### springdoc-openapi (Swagger UI)

* **What:** Generates OpenAPI docs and UI.
* **Why:** Interactive API contract for devs and tests.
* **Fits:** `/swagger-ui.html` in backend.
* **Depends on:** Spring Web annotations.

### Lombok

* **What:** Compile-time boilerplate reduction.
* **Why:** `@Getter/@Setter/@Builder` etc. for terse entities/DTOs.
* **Fits:** Domain/DTO layers.
* **Depends on:** IDE/annotation processing enabled.

### ModelMapper (or MapStruct)

* **What:** DTO ↔ entity mapping.
* **Why:** Keep API models decoupled from persistence layer.
* **Fits:** Service layer transformation.
* **Depends on:** Library jars; optional compile-time processors.

### Actuator

* **What:** Operational endpoints (/health, /info, metrics).
* **Why:** Health checks for Compose; observability.
* **Fits:** Readiness/liveness for orchestrators.
* **Depends on:** Micrometer; optional Prometheus exporter.

### Jackson / Validation (Hibernate Validator)

* **What:** JSON serialization; bean validation (`@Valid`).
* **Why:** Enforce request/response schemas; safe parsing.
* **Fits:** Controller boundaries.
* **Depends on:** javax/jakarta validation API.

### Build Tool: Maven (or Gradle)

* **What:** Dependency mgmt, lifecycle, plugin ecosystem.
* **Why:** Reproducible builds, tests, packaging, Liquibase, checks.
* **Fits:** CI/CD pipelines and local builds.
* **Depends on:** `pom.xml` (or `build.gradle`) with plugin/deps graph.

---

# Data Layer

## PostgreSQL

* **What:** Relational database.
* **Features:** ACID, indexing, JSONB, robust SQL.
* **Full-stack fit:** Primary app DB for backend entities.
* **Depends on:** Persistent volume; network access from backend.
* **Prod simulation:** Same engine, credentials via env, port 5432.

## PostGIS

* **What:** Geospatial extension for Postgres.
* **Features:** Geometry/Geography types, spatial indexes, ST\_\* functions.
* **Full-stack fit:** Enables spatial queries for maps/locations.
* **Depends on:** PostgreSQL; extension enabled in DB.
* **Prod simulation:** Same spatial capabilities as prod.

## pgAdmin 4

* **What:** Web UI for Postgres administration.
* **Features:** Query tool, ERD, backup/restore, role management.
* **Full-stack fit:** Developer DBA tasks in local environment.
* **Depends on:** Postgres connection info; its own config volume.
* **Prod simulation:** Mirrors DBA workflows without touching prod.

---

# Identity & Access

## Keycloak

* **What:** Identity Provider (IdP) for OIDC/OAuth2/SAML.
* **Features:** Realms, clients, users, roles, token exchange, admin console.
* **Full-stack fit:** Central auth; SPA logs in via OIDC, backend validates JWTs.
* **Depends on:** Its own Postgres DB (`demoapp-kc-db`), realm import on startup.
* **Prod simulation:** True IdP flows (PKCE, refresh, roles/scopes) without cloud dependencies.

## Keycloak Database (PostgreSQL)

* **What:** Separate DB instance for Keycloak data.
* **Features:** Stores realms, users, sessions, client config.
* **Full-stack fit:** Keeps IdP state isolated from app data.
* **Depends on:** Volume for persistence, Keycloak migration scripts.
* **Prod simulation:** Matches typical “separate auth DB” pattern.

---

# Cloud Emulation & Storage

## LocalStack (S3)

* **What:** Local AWS service emulator (here focusing on S3).
* **Features:** S3 buckets/objects, presigned URLs, IAM-ish behavior for tests.
* **Full-stack fit:** Backend writes/reads objects as if using AWS S3; SPA may fetch via API.
* **Depends on:** Docker; optional init scripts to precreate buckets.
* **Prod simulation:** Same S3 API surface/endpoint with `--endpoint-url http://localhost:4566`.

## AWS CLI

* **What:** Command-line client for AWS APIs.
* **Features:** s3 mb/ls/cp, IAM/SQS/SNS commands, profiles.
* **Full-stack fit:** Smoke tests and setup against LocalStack.
* **Depends on:** LocalStack endpoint; local credentials/profile.
* **Prod simulation:** Same CLI you’d use in prod—just pointed to LocalStack.

## AWS SDK for Java (S3)

* **What:** Java client libraries (v2) for AWS services.
* **Features:** Non-blocking I/O, authenticators, retries, per-service modules.
* **Full-stack fit:** Backend uploads/downloads to S3 (LocalStack) and sets object tags/metadata.
* **Depends on:** AWS creds/region; S3 endpoint override for LocalStack.
* **Prod simulation:** Swap the endpoint to real AWS and redeploy—no code changes.

---

# Security Monitoring (Dev) & Amazon GuardDuty

## GuardDuty Emulator (custom service)

* **What:** Local component that scans/tags S3 objects to mimic security scanning flows.
* **Features:** Polls bucket, marks objects (e.g., `NO_THREATS_FOUND`), emits logs.
* **Full-stack fit:** Lets you test “file uploaded → scanned → status updated” business logic.
* **Depends on:** LocalStack S3; backend hooks/listeners.
* **Prod simulation:** Imitates down-stream effects you’d expect from a security scanner.

## Amazon GuardDuty (real service)

* **What:** **Continuous security monitoring** for AWS accounts, data, and workloads.
  **Can help identify unexpected and potentially unauthorized or malicious activity** in your AWS environment.
* **Full-stack fit (prod):** In production, GuardDuty findings (e.g., suspicious S3 or IAM activity) can trigger notifications, lambdas, or workflows your app consumes.
* **Simulation mapping:** Local emulator approximates “object scanned & verdict produced” so your app logic is ready before connecting to the real GuardDuty/notification pipeline.

---

# Document & Content Processing (optional, if your backend uses it)

## Apache PDFBox

* **What:** PDF parsing/rendering.
* **Features:** Text/image extraction, form fields, PDF to images.
* **Full-stack fit:** Backend ingests PDFs, extracts text or thumbnails.
* **Depends on:** PDFBox + graphics libs (ImageIO plugins).
* **Prod simulation:** Same parsing path as prod inside container.

## Tesseract OCR (+ Tess4J)

* **What:** OCR engine with Java bindings.
* **Features:** Multi-language OCR, layout analysis.
* **Full-stack fit:** Convert scanned documents/images to searchable text.
* **Depends on:** Native Tesseract/Leptonica binaries in the image.
* **Prod simulation:** Validates OCR quality and performance characteristics locally.

## Apache Tika

* **What:** Content detection & extraction.
* **Features:** MIME sniffing, metadata, text extraction for many formats.
* **Full-stack fit:** Prepares documents for indexing/search/classification.
* **Depends on:** Java libs only.
* **Prod simulation:** Same ingestion pipeline end-to-end.

---

# Observability & Health

## Healthchecks (Docker Compose) + Spring Actuator

* **What:** Container-level checks and app-level health.
* **Features:** `test` commands, retry intervals; `/actuator/health`.
* **Full-stack fit:** Ensures Keycloak/DB are “ready” before backend starts.
* **Depends on:** Service endpoints responding.
* **Prod simulation:** Mimics orchestration readiness/liveness gates.

---

# Base OS & Architecture

## Alpine Linux (container base)

* **What:** Minimal Linux base images.
* **Features:** Small footprint, fast boot, apk package manager.
* **Full-stack fit:** Keeps images small (backend, custom tools).
* **Depends on:** musl libc; consider glibc if native deps require it.
* **Prod simulation:** Matches many prod base images and hardening approaches.

## linux/amd64 on Apple Silicon (compat setting)

* **What:** Cross-arch setting for Apple M-series hosts.
* **Features:** Forces x86\_64 images to run via emulation (if needed).
* **Full-stack fit:** Ensures image parity with prod when dev machine is ARM.
* **Depends on:** Docker Desktop’s emulation/QEMU.
* **Prod simulation:** Eliminates “works on my ARM laptop” drift vs. x86 prod nodes.

---

# Test & QA (Integration-grade)

## Testcontainers

* **What:** Spin up real dependencies in tests (Postgres, LocalStack).
* **Features:** Disposable containers, waits for readiness, dynamic ports.
* **Full-stack fit:** Integration tests run against real DB/S3 emulation.
* **Depends on:** Docker daemon available during test runs.
* **Prod simulation:** Confidence that services integrate the same way in CI as local.

## REST Assured

* **What:** Fluent HTTP testing for APIs.
* **Features:** Given/When/Then assertions, JSON path checks.
* **Full-stack fit:** Verifies API contracts your SPA and partners rely on.
* **Depends on:** Running backend (or SpringBootTest context).
* **Prod simulation:** Treats the app as a black-box API like real clients do.

---

## How the pieces simulate production together

* **Networking parity:** Compose network + service DNS ≈ VPC subnets + service discovery.
* **Security parity:** Keycloak issues real OIDC tokens; backend validates JWTs just like prod.
* **Data parity:** Postgres/PostGIS schemas/migrations via Liquibase; persistent volumes ≈ real DB disks.
* **Edge parity:** Nginx serves SPA and proxies APIs, enforcing headers (e.g., CSP) like a CDN/ingress.
* **Cloud parity:** LocalStack gives S3 endpoints; AWS CLI/SDK run unchanged except the endpoint URL.
* **Ops parity:** Actuator + healthchecks model readiness/liveness; logs and exit codes drive orchestration.
* **Compliance parity:** GuardDuty emulator models a “scan → verdict → workflow” path so your business logic is production-ready before wiring into **Amazon GuardDuty** and actual AWS notifications.

If you want, I can convert this into a printable one-pager (PDF/Word) or a README.md tailored to your exact service names from your `docker-compose.yml`.

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

* **[Amazon GuardDuty](https://docs.aws.amazon.com/guardduty/)** is a continuous security monitoring service. Amazon GuardDuty can help to identify unexpected and potentially unauthorized or malicious activity in your AWS environment.<br>
    In this local dev stack, the demoapp-guardduty service is a GuardDuty-style emulator that watches objects in LocalStack S3 and tags them (e.g., NO_THREATS_FOUND) to simulate scanning flows for development.


(Example dev runner in a custom emulator container):
## inside ./guard-duty-emulation Docker image
python guardduty_emulator.py --endpoint http://demoapp-localstack:4566 --bucket demoapp-bucket --interval 3

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

