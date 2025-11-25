FROM eclipse-temurin:21-jdk-alpine as builder

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY Java21WebLombokApp/mvnw .
COPY Java21WebLombokApp/.mvn .mvn
COPY Java21WebLombokApp/pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY Java21WebLombokApp/src src

# Build the application
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
