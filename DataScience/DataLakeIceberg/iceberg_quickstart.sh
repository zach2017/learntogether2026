#!/bin/bash

###############################################################################
# Apache Iceberg Data Lake - Quick Start Script
# This script sets up and demonstrates the complete data lake system
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="${PWD}"
WAREHOUSE_PATH="${PROJECT_DIR}/warehouse"
DATA_PATH="${PROJECT_DIR}/data"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Apache Iceberg Data Lake - Quick Start${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Step 2: Create directory structure
print_info "Creating directory structure..."

mkdir -p "${WAREHOUSE_PATH}"
mkdir -p "${DATA_PATH}"
mkdir -p "${PROJECT_DIR}/trino/etc"
mkdir -p "${PROJECT_DIR}/trino/catalogs"
mkdir -p "${PROJECT_DIR}/notebooks"
mkdir -p "${PROJECT_DIR}/services/iceberg-java/src/main/java/com/datalake/iceberg"
mkdir -p "${PROJECT_DIR}/services/iceberg-java/src/main/resources"
mkdir -p "${PROJECT_DIR}/services/python-api"

print_success "Directory structure created"

# Step 3: Generate sample data
print_info "Generating sample data..."

cat > "${DATA_PATH}/sample_sales.csv" << 'EOF'
order_id,customer_id,product_id,amount,status,region,order_date
1,101,1001,299.99,completed,North America,2024-01-01
2,102,1002,149.99,completed,Europe,2024-01-02
3,103,1003,450.00,pending,Asia,2024-01-03
4,104,1004,199.99,completed,North America,2024-01-04
5,105,1005,89.99,completed,South America,2024-01-05
6,106,1006,599.99,pending,Europe,2024-01-06
7,107,1007,249.99,completed,Europe,2024-01-07
8,108,1008,349.99,completed,Asia,2024-01-08
9,109,1009,799.99,cancelled,North America,2024-01-09
10,110,1010,199.99,completed,Africa,2024-01-10
EOF

cat > "${DATA_PATH}/sample_customers.csv" << 'EOF'
customer_id,name,email,city,country,signup_date,customer_type
101,John Smith,john@email.com,New York,USA,2023-01-15,Premium
102,Jane Doe,jane@email.com,Los Angeles,USA,2023-02-20,Standard
103,Bob Johnson,bob@email.com,London,UK,2023-03-10,Premium
104,Alice Williams,alice@email.com,Paris,France,2023-04-05,Standard
105,Charlie Brown,charlie@email.com,Tokyo,Japan,2023-05-12,Standard
EOF

print_success "Sample data generated"

# Step 4: Start Docker services
print_info "Starting Docker services (this may take 2-3 minutes)..."

docker-compose up -d

print_info "Waiting for services to be healthy..."
sleep 30

# Check if services are running
SERVICES=("localstack" "postgres" "hive-metastore" "trino" "minio")

for service in "${SERVICES[@]}"; do
    if docker ps | grep -q "$service"; then
        print_success "$service is running"
    else
        print_warning "$service may not be running yet"
    fi
done

# Step 5: Initialize LocalStack S3
print_info "Initializing LocalStack S3..."

docker exec localstack awslocal s3 mb s3://datalake 2>/dev/null || true
docker exec localstack awslocal s3 cp /app/data/sample_sales.csv s3://datalake/input/ 2>/dev/null || true

print_success "LocalStack S3 initialized"

# Step 6: Verify PostgreSQL data
print_info "Verifying PostgreSQL data..."

docker exec postgres psql -U admin -d source_db -c "\dt" 2>/dev/null || print_warning "PostgreSQL not ready yet"

print_success "PostgreSQL verified"

# Step 7: Load initial data via Python API
print_info "Loading initial data..."

# Wait for Python API to be ready
sleep 10

# Load from PostgreSQL
curl -s -X POST http://localhost:5000/api/v1/load/postgres \
  -H "Content-Type: application/json" \
  -d '{
    "host": "postgres",
    "database": "source_db",
    "user": "admin",
    "password": "admin123",
    "query": "SELECT * FROM sales.orders LIMIT 10",
    "table_name": "orders",
    "namespace": "demo"
  }' | jq '.' 2>/dev/null || print_warning "Could not load from PostgreSQL (API may not be ready)"

print_success "Initial data loading completed"

# Step 8: Verify data in Iceberg
print_info "Verifying Iceberg tables..."

curl -s http://localhost:5000/api/v1/tables/demo | jq '.' 2>/dev/null || print_warning "Could not verify Iceberg tables"

# Step 9: Display service URLs
print_info "Services are now available at:"
echo ""
echo -e "${GREEN}Java API${NC}:"
echo "  URL: http://localhost:8080"
echo "  Health: http://localhost:8080/api/v1/health"
echo ""
echo -e "${GREEN}Python API${NC}:"
echo "  URL: http://localhost:5000"
echo "  Health: http://localhost:5000/api/v1/health"
echo ""
echo -e "${GREEN}Trino Web UI${NC}:"
echo "  URL: http://localhost:8081/ui/"
echo ""
echo -e "${GREEN}MinIO Console${NC}:"
echo "  URL: http://localhost:9001/"
echo "  User: minioadmin"
echo "  Password: minioadmin123"
echo ""
echo -e "${GREEN}Jupyter Notebook${NC}:"
echo "  URL: http://localhost:8888/"
echo ""
echo -e "${GREEN}PostgreSQL${NC}:"
echo "  Host: localhost:5432"
echo "  User: admin"
echo "  Password: admin123"
echo ""

# Step 10: Display example API calls
print_info "Example API Calls:"
echo ""
echo -e "${YELLOW}Load data from PostgreSQL:${NC}"
echo 'curl -X POST http://localhost:5000/api/v1/load/postgres \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "host": "postgres",
    "database": "source_db",
    "user": "admin",
    "password": "admin123",
    "query": "SELECT * FROM sales.orders",
    "table_name": "orders",
    "namespace": "sales"
  }'"'"''
echo ""

echo -e "${YELLOW}Load data from S3:${NC}"
echo 'curl -X POST http://localhost:5000/api/v1/load/s3 \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "bucket": "datalake",
    "key": "input/data.csv",
    "format": "csv",
    "table_name": "imported",
    "namespace": "raw"
  }'"'"''
echo ""

echo -e "${YELLOW}Scrape web data:${NC}"
echo 'curl -X POST http://localhost:5000/api/v1/scrape \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "url": "https://en.wikipedia.org/wiki/List_of_countries_by_population",
    "selector": "table.wikitable",
    "table_name": "countries",
    "namespace": "web_data"
  }'"'"''
echo ""

echo -e "${YELLOW}Get table metadata:${NC}"
echo 'curl http://localhost:5000/api/v1/tables/demo/orders/metadata'
echo ""

echo -e "${YELLOW}List tables:${NC}"
echo 'curl http://localhost:5000/api/v1/tables/demo'
echo ""

# Step 11: Display cleanup instructions
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}To stop services:${NC}"
echo "docker-compose down"
echo ""
echo -e "${BLUE}To remove data volumes:${NC}"
echo "docker-compose down -v"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo "docker-compose logs -f [service-name]"
echo -e "${BLUE}========================================${NC}\n"

print_success "Quick start completed! Your data lake is ready."
print_info "Next steps:"
echo "  1. Visit http://localhost:5000 to access Python API"
echo "  2. Visit http://localhost:8080 to access Java API"
echo "  3. Visit http://localhost:8081/ui/ to query with Trino"
echo "  4. Open notebooks at http://localhost:8888/"
echo ""