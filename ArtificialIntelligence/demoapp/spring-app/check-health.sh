#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Document Upload System - Health Check & Debug         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Function to check service health
check_service() {
    local service=$1
    local port=$2
    local check_url=$3
    
    echo ""
    echo -e "${YELLOW}━━━ $service ━━━${NC}"
    
    # Check if container is running
    if docker-compose ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✓ Container is running${NC}"
    else
        echo -e "${RED}✗ Container is NOT running${NC}"
        return 1
    fi
    
    # Check port
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✓ Port $port is listening${NC}"
    else
        echo -e "${RED}✗ Port $port is NOT listening${NC}"
    fi
    
    # Check URL if provided
    if [ -n "$check_url" ]; then
        if curl -s "$check_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Service is responding${NC}"
        else
            echo -e "${RED}✗ Service is NOT responding${NC}"
        fi
    fi
}

# Check Docker
echo ""
echo -e "${YELLOW}━━━ Docker Status ━━━${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
    docker --version | sed "s/^/  /"
else
    echo -e "${RED}✗ Docker is NOT installed${NC}"
fi

if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
else
    echo -e "${RED}✗ Docker daemon is NOT running${NC}"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
    docker-compose --version | sed "s/^/  /"
else
    echo -e "${RED}✗ Docker Compose is NOT installed${NC}"
fi

# Check services
echo ""
echo -e "${YELLOW}━━━ Service Status ━━━${NC}"

docker-compose ps

# Detailed service checks
check_service "localstack" "4566" "http://localhost:4566/_localstack/health"
check_service "postgres" "5432" ""
check_service "spring-app" "8080" "http://localhost:8080/api/documents"
check_service "python-summary-service" "" ""

# Check logs
echo ""
echo -e "${YELLOW}━━━ Recent Errors ━━━${NC}"

for service in localstack postgres spring-app python-summary-service; do
    echo ""
    echo -e "${BLUE}--- $service ---${NC}"
    docker-compose logs "$service" 2>/dev/null | tail -5 | grep -i "error\|failed\|exception" || echo "No errors found"
done

# Database check
echo ""
echo -e "${YELLOW}━━━ Database Check ━━━${NC}"

if docker-compose exec -T postgres pg_isready -U docuser -d document_db > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
    
    # Check tables
    TABLE_COUNT=$(docker-compose exec -T postgres psql -U docuser -d document_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
    echo -e "${BLUE}  Tables: $TABLE_COUNT${NC}"
    
    # Check documents
    DOC_COUNT=$(docker-compose exec -T postgres psql -U docuser -d document_db -t -c "SELECT COUNT(*) FROM documents;" 2>/dev/null)
    echo -e "${BLUE}  Documents: $DOC_COUNT${NC}"
else
    echo -e "${RED}✗ Database connection FAILED${NC}"
fi

# S3 check
echo ""
echo -e "${YELLOW}━━━ AWS S3 (LocalStack) Check ━━━${NC}"

if aws s3 ls --endpoint-url http://localhost:4566 2>/dev/null | grep -q "documents"; then
    echo -e "${GREEN}✓ S3 bucket 'documents' exists${NC}"
else
    echo -e "${RED}✗ S3 bucket 'documents' NOT found${NC}"
fi

# SQS check
echo ""
echo -e "${YELLOW}━━━ AWS SQS (LocalStack) Check ━━━${NC}"

if aws sqs list-queues --endpoint-url http://localhost:4566 2>/dev/null | grep -q "document-queue"; then
    echo -e "${GREEN}✓ SQS queue 'document-queue' exists${NC}"
else
    echo -e "${RED}✗ SQS queue 'document-queue' NOT found${NC}"
fi

# Network check
echo ""
echo -e "${YELLOW}━━━ Network Check ━━━${NC}"

if docker network ls | grep -q "document_network"; then
    echo -e "${GREEN}✓ Document network exists${NC}"
else
    echo -e "${RED}✗ Document network NOT found${NC}"
fi

# Common issues
echo ""
echo -e "${YELLOW}━━━ Recommendations ━━━${NC}"

if ! curl -s http://localhost:8080/api/documents > /dev/null 2>&1; then
    echo -e "${RED}• Spring API is not responding${NC}"
    echo -e "  Fix: Wait longer or check logs: ${BLUE}docker-compose logs spring-app${NC}"
fi

if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}• LocalStack is not responding${NC}"
    echo -e "  Fix: Check logs: ${BLUE}docker-compose logs localstack${NC}"
fi

if ! docker-compose exec -T postgres pg_isready -U docuser > /dev/null 2>&1; then
    echo -e "${RED}• PostgreSQL is not responding${NC}"
    echo -e "  Fix: Check logs: ${BLUE}docker-compose logs postgres${NC}"
fi

if [ -z "$(docker ps -q)" ]; then
    echo -e "${RED}• No containers are running${NC}"
    echo -e "  Fix: Start services: ${BLUE}./start.sh${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Health Check Complete                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  • View all logs:          ${BLUE}docker-compose logs -f${NC}"
echo -e "  • View specific service:  ${BLUE}docker-compose logs -f spring-app${NC}"
echo -e "  • Restart all services:   ${BLUE}docker-compose restart${NC}"
echo -e "  • Restart one service:    ${BLUE}docker-compose restart spring-app${NC}"
echo -e "  • Stop all services:      ${BLUE}docker-compose stop${NC}"
echo -e "  • Clean and restart:      ${BLUE}./start.sh clean${NC}"
echo -e "  • Execute database query: ${BLUE}docker-compose exec postgres psql -U docuser -d document_db${NC}"
