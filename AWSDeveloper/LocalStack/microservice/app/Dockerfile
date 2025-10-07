
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

// application.yml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true

aws:
  endpoint: ${AWS_ENDPOINT}
  region: ${AWS_REGION}
  accessKeyId: ${AWS_ACCESS_KEY_ID}
  secretAccessKey: ${AWS_SECRET_ACCESS_KEY}

s3:
  bucket:
    name: ${S3_BUCKET_NAME}

dynamodb:
  table:
    name: ${DYNAMODB_TABLE_NAME}

cognito:
  endpoint: ${COGNITO_ENDPOINT}
  userPoolId: ${COGNITO_USER_POOL_ID}
  clientId: ${COGNITO_CLIENT_ID}