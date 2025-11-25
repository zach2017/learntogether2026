#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Document Upload & Summary System - Advanced Startup        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose detected${NC}"

# Get Docker version
DOCKER_VERSION=$(docker --version)
echo -e "${YELLOW}  $DOCKER_VERSION${NC}"

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo -e "${YELLOW}  Start Docker and try again${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}\n"

# Check port availability
echo -e "${YELLOW}Checking port availability...${NC}"

PORTS_OK=true
for port in 8080 5432 4566; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}✗ Port $port is already in use${NC}"
        PORTS_OK=false
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
done

if [ "$PORTS_OK" = false ]; then
    echo -e "${RED}Please free up the ports and try again${NC}"
    exit 1
fi

echo ""

# Clean up old containers if requested
if [ "$1" = "clean" ]; then
    echo -e "${YELLOW}Cleaning up old containers and volumes...${NC}"
    docker-compose down -v 2>/dev/null || true
    echo -e "${GREEN}✓ Cleanup complete${NC}\n"
fi

# Make init script executable
if [ -f ./docker/localstack-init.sh ]; then
    chmod +x ./docker/localstack-init.sh
    echo -e "${GREEN}✓ LocalStack init script is ready${NC}"
fi

# Stop existing services gracefully
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${YELLOW}Stopping existing services...${NC}"
    docker-compose down 2>/dev/null || true
    sleep 2
fi

# Start services
echo -e "${YELLOW}Starting services with Docker Compose...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

docker-compose up --build -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start services${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Services started${NC}\n"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check LocalStack
echo -e "${YELLOW}Checking LocalStack (S3 & SQS)...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4566/_localstack/health | grep -q "running"; then
        echo -e "${GREEN}✓ LocalStack is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ LocalStack did not start${NC}"
        docker-compose logs localstack | tail -20
    fi
    echo -n "."
    sleep 1
done

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U docuser -d document_db > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ PostgreSQL did not start${NC}"
        docker-compose logs postgres | tail -20
    fi
    echo -n "."
    sleep 1
done

# Check Spring App
echo -e "${YELLOW}Checking Spring Boot API...${NC}"
for i in {1..40}; do
    if curl -s http://localhost:8080/api/documents > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Spring Boot API is ready${NC}"
        break
    fi
    if [ $i -eq 40 ]; then
        echo -e "${RED}✗ Spring Boot API did not start${NC}"
        docker-compose logs spring-app | tail -30
    fi
    echo -n "."
    sleep 1
done

# Give Python service a moment to connect
sleep 3
echo ""

# Show service status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    STARTUP SUCCESSFUL! 🎉                      ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:   ${BLUE}http://localhost:8080${GREEN}                              ║${NC}"
echo -e "${GREEN}║  API:        ${BLUE}http://localhost:8080/api/documents${GREEN}                ║${NC}"
echo -e "${GREEN}║  Database:   ${BLUE}localhost:5432${GREEN} (docuser/docpass123)               ║${NC}"
echo -e "${GREEN}║  LocalStack: ${BLUE}http://localhost:4566${GREEN}                             ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Useful Commands:                                             ║${NC}"
echo -e "${GREEN}║  • View logs:      ${BLUE}docker-compose logs -f${GREEN}                       ║${NC}"
echo -e "${GREEN}║  • Restart all:    ${BLUE}docker-compose restart${GREEN}                      ║${NC}"
echo -e "${GREEN}║  • Stop services:  ${BLUE}docker-compose stop${GREEN}                         ║${NC}"
echo -e "${GREEN}║  • Clean & restart:${BLUE}./start.sh clean${GREEN}                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}Testing API connectivity...${NC}"
RESPONSE=$(curl -s http://localhost:8080/api/documents)
if echo "$RESPONSE" | grep -q "\[\]"; then
    echo -e "${GREEN}✓ API is responding correctly${NC}"
else
    echo -e "${RED}⚠ API response: $RESPONSE${NC}"
fi

echo ""
echo -e "${BLUE}Opening browser...${NC}"
sleep 2

# Try to open browser based on OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080 2>/dev/null
    elif command -v firefox &> /dev/null; then
        firefox http://localhost:8080 2>/dev/null &
    else
        echo -e "${YELLOW}Please visit: http://localhost:8080${NC}"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8080 2>/dev/null || echo -e "${YELLOW}Please visit: http://localhost:8080${NC}"
else
    echo -e "${YELLOW}Please visit: http://localhost:8080${NC}"
fi

echo ""
echo -e "${GREEN}All services are running! 🚀${NC}"
echo -e "${YELLOW}To view logs: ${BLUE}docker-compose logs -f${NC}"
echo -e "${YELLOW}To stop:      ${BLUE}docker-compose stop${NC}"

