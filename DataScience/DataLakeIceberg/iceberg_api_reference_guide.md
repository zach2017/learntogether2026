# API Reference Guide

## Java API (Port 8080)

### 1. Load from PostgreSQL

**Endpoint**: `POST /api/v1/load/postgres`

**Request**:
```json
{
  "host": "postgres",
  "database": "source_db",
  "user": "admin",
  "password": "admin123",
  "query": "SELECT * FROM sales.orders LIMIT 100",
  "tableName": "orders",
  "namespace": "staging"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Data loaded from PostgreSQL",
  "table": "staging.orders",
  "rows_loaded": 100
}
```

**Use When**: Loading from operational databases, OLTP systems

---

### 2. Load from S3

**Endpoint**: `POST /api/v1/load/s3`

**Request**:
```json
{
  "s3Path": "s3a://datalake/data/products.parquet",
  "format": "parquet",
  "tableName": "products",
  "namespace": "raw",
  "endpoint": "http://localstack:4566",
  "accessKey": "test",
  "secretKey": "test"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Data loaded from S3",
  "table": "raw.products",
  "s3_path": "s3a://datalake/data/products.parquet",
  "rows": 5000
}
```

**Use When**: Loading from cloud storage, data lakes, backups

---

### 3. Load from File

**Endpoint**: `POST /api/v1/load/file`

**Request**:
```json
{
  "filePath": "/data/customers.csv",
  "format": "csv",
  "tableName": "customers",
  "namespace": "raw"
}
```

**Response**:
```json
{
  "status": "success",
  "table": "raw.customers",
  "rows": 1000
}
```

**Use When**: Loading from local files, CSVs, exports

---

### 4. List Tables

**Endpoint**: `GET /api/v1/tables/{namespace}`

**Example**: `GET /api/v1/tables/staging`

**Response**:
```json
{
  "status": "success",
  "namespace": "staging",
  "tables": ["orders", "customers", "products"],
  "count": 3
}
```

---

### 5. Get Table Metadata

**Endpoint**: `GET /api/v1/tables/{namespace}/{table}/metadata`

**Example**: `GET /api/v1/tables/staging/orders/metadata`

**Response**:
```json
{
  "table_name": "orders",
  "namespace": "staging",
  "schema": "order_id INT, customer_id INT, amount DECIMAL, status VARCHAR, region VARCHAR",
  "partition_spec": "PARTITION BY order_date",
  "snapshots": 5,
  "current_snapshot": 123456789,
  "row_count": "1000",
  "location": "s3a://datalake/warehouse/staging/orders/"
}
```

---

### 6. Get Row Count

**Endpoint**: `GET /api/v1/tables/{namespace}/{table}/count`

**Example**: `GET /api/v1/tables/staging/orders/count`

**Response**:
```json
{
  "status": "success",
  "table": "staging.orders",
  "row_count": 1000
}
```

---

### 7. Migrate Table

**Endpoint**: `POST /api/v1/migrate`

**Request**:
```json
{
  "sourceNamespace": "staging",
  "sourceTable": "orders",
  "destNamespace": "production",
  "destTable": "orders"
}
```

**Response**:
```json
{
  "status": "success",
  "source": "staging.orders",
  "destination": "production.orders",
  "rows_migrated": 1000,
  "duration_seconds": 2.5
}
```

**Use When**: Moving validated data to production, warehouse consolidation

---

## Python API (Port 5000)

### 1. Load from PostgreSQL

**Endpoint**: `POST /api/v1/load/postgres`

**Request**:
```json
{
  "host": "postgres",
  "database": "source_db",
  "user": "admin",
  "password": "admin123",
  "query": "SELECT * FROM customers.customer_info",
  "table_name": "customers",
  "namespace": "raw"
}
```

**Response**:
```json
{
  "status": "success",
  "table": "raw.customers",
  "rows_loaded": 500,
  "columns": ["customer_id", "name", "email", "city", "country", "signup_date", "customer_type"]
}
```

---

### 2. Load from S3

**Endpoint**: `POST /api/v1/load/s3`

**Request**:
```json
{
  "bucket": "datalake",
  "key": "input/sales.csv",
  "format": "csv",
  "table_name": "sales",
  "namespace": "raw"
}
```

**Response**:
```json
{
  "status": "success",
  "table": "raw.sales",
  "rows_loaded": 2000,
  "s3_source": "s3://datalake/input/sales.csv"
}
```

---

### 3. Scrape Web Data

**Endpoint**: `POST /api/v1/scrape`

**Request**:
```json
{
  "url": "https://en.wikipedia.org/wiki/List_of_countries_by_GDP",
  "selector": "table.wikitable",
  "table_name": "countries_gdp",
  "namespace": "web_data"
}
```

**Response**:
```json
{
  "status": "success",
  "table": "web_data.countries_gdp",
  "rows_scraped": 193,
  "columns": ["Country", "Region", "GDP", "GDP_per_capita"],
  "source_url": "https://en.wikipedia.org/wiki/List_of_countries_by_GDP"
}
```

**Supported HTML elements**:
- Tables: `.wikitable`, `.table`, `table`
- Lists: `ul li`, `ol li`
- Divs: `.data-row`, `[data-id]`

---

### 4. Scrape JSON API

**Endpoint**: `POST /api/v1/scrape-api`

**Request**:
```json
{
  "url": "https://api.github.com/repos/apache/iceberg/issues",
  "selector": "data.issues",
  "table_name": "github_issues",
  "namespace": "api_data",
  "params": {"state": "closed", "per_page": 100}
}
```

**Response**:
```json
{
  "status": "success",
  "table": "api_data.github_issues",
  "records": 100,
  "source_url": "https://api.github.com/repos/apache/iceberg/issues"
}
```

---

### 5. Load from File

**Endpoint**: `POST /api/v1/load/file`

**Request**:
```json
{
  "file_path": "/data/products.parquet",
  "format": "parquet",
  "table_name": "products",
  "namespace": "raw"
}
```

**Response**:
```json
{
  "status": "success",
  "table": "raw.products",
  "rows_loaded": 50000,
  "columns": ["product_id", "name", "price", "category"]
}
```

---

### 6. Get Table Metadata

**Endpoint**: `GET /api/v1/tables/<namespace>/<table>/metadata`

**Example**: `GET /api/v1/tables/raw/customers/metadata`

**Response**:
```json
{
  "table_name": "customers",
  "namespace": "raw",
  "schema": "customer_id INT, name VARCHAR, email VARCHAR, city VARCHAR",
  "partitions": "PARTITION BY city",
  "location": "s3a://datalake/warehouse/raw/customers/",
  "snapshots": 3,
  "current_snapshot_id": 987654321
}
```

---

### 7. List Tables in Namespace

**Endpoint**: `GET /api/v1/tables/<namespace>`

**Example**: `GET /api/v1/tables/raw`

**Response**:
```json
{
  "namespace": "raw",
  "tables": ["orders", "customers", "products", "sales"],
  "count": 4
}
```

---

### 8. Migrate Table

**Endpoint**: `POST /api/v1/migrate`

**Request**:
```json
{
  "source_namespace": "raw",
  "source_table": "customers",
  "dest_namespace": "production",
  "dest_table": "customers"
}
```

**Response**:
```json
{
  "status": "success",
  "source": "raw.customers",
  "destination": "production.customers",
  "rows_migrated": 500
}
```

---

### 9. Upload to S3

**Endpoint**: `POST /api/v1/upload/s3`

**Request**:
```json
{
  "file_path": "/data/analysis_results.csv",
  "bucket": "datalake",
  "key": "output/analysis_results.csv"
}
```

**Response**:
```json
{
  "status": "success",
  "file": "/data/analysis_results.csv",
  "s3_location": "s3://datalake/output/analysis_results.csv"
}
```

---

## Trino SQL Reference

### Query Iceberg Tables

```sql
-- Basic select
SELECT * FROM iceberg.raw.customers LIMIT 10;

-- Aggregation
SELECT city, COUNT(*) as customer_count
FROM iceberg.raw.customers
GROUP BY city;

-- Filter by status
SELECT order_id, amount, status
FROM iceberg.raw.orders
WHERE status = 'completed' AND amount > 100;
```

### Join Across Namespaces

```sql
-- Join two Iceberg tables
SELECT 
  o.order_id,
  c.name,
  o.amount,
  o.order_date
FROM iceberg.raw.orders o
JOIN iceberg.raw.customers c ON o.customer_id = c.customer_id
WHERE o.amount > 500;
```

### Join Iceberg with PostgreSQL

```sql
-- Query across catalog boundaries
SELECT 
  i.order_id,
  p.name AS customer_name,
  i.amount
FROM iceberg.raw.orders i
JOIN postgres.public.customers p ON i.customer_id = p.id;
```

### Time Travel (Historical Queries)

```sql
-- Query as of specific timestamp
SELECT * FROM iceberg.raw.customers 
  FOR VERSION AS OF 1704067200000;

-- Show all snapshots
SELECT * FROM iceberg.raw.customers.history;

-- Show metadata changes
SELECT * FROM iceberg.raw.customers.metadata_log_entries;
```

### Update & Delete

```sql
-- Update rows
UPDATE iceberg.raw.orders
SET status = 'shipped'
WHERE order_id = 123;

-- Delete rows
DELETE FROM iceberg.raw.orders
WHERE status = 'cancelled' AND order_date < DATE '2024-01-01';
```

### Window Functions

```sql
-- Rank customers by spending
SELECT 
  customer_id,
  SUM(amount) as total_spent,
  ROW_NUMBER() OVER (ORDER BY SUM(amount) DESC) as rank
FROM iceberg.raw.orders
GROUP BY customer_id
LIMIT 10;
```

---

## Common Workflows

### Workflow 1: Daily Data Refresh

```bash
# Morning: Load fresh data
curl -X POST http://localhost:5000/api/v1/load/postgres \
  -H "Content-Type: application/json" \
  -d '{
    "host": "postgres",
    "database": "production",
    "user": "admin",
    "password": "admin123",
    "query": "SELECT * FROM orders WHERE created_at = CURRENT_DATE",
    "table_name": "orders_today",
    "namespace": "daily"
  }'

# Afternoon: Migrate to archive
curl -X POST http://localhost:5000/api/v1/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "source_namespace": "daily",
    "source_table": "orders_today",
    "dest_namespace": "archive",
    "dest_table": "orders_2024_01_15"
  }'
```

### Workflow 2: Data Quality Checks

```bash
# Load data
curl -X POST http://localhost:5000/api/v1/load/postgres \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM staging_data", "namespace": "validation", ...}'

# Get metadata
curl -X GET http://localhost:5000/api/v1/tables/validation/staging_data/metadata

# Query in Trino for anomalies
# SELECT * FROM iceberg.validation.staging_data 
# WHERE amount < 0 OR customer_id IS NULL;

# If valid, migrate to production
curl -X POST http://localhost:5000/api/v1/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "source_namespace": "validation",
    "source_table": "staging_data",
    "dest_namespace": "production",
    "dest_table": "data"
  }'
```

### Workflow 3: Multi-Source Analysis

```bash
# Load from all sources
# 1. PostgreSQL operational data
curl -X POST http://localhost:5000/api/v1/load/postgres ...

# 2. S3 historical data
curl -X POST http://localhost:5000/api/v1/load/s3 ...

# 3. Web competitor data
curl -X POST http://localhost:5000/api/v1/scrape ...

# Query combined in Trino
# SELECT 
#   iceberg.operational.sales.customer_id,
#   iceberg.historical.sales.amount,
#   iceberg.competitive.pricing.competitor_price
# FROM iceberg.operational.sales
# LEFT JOIN iceberg.historical.sales ON ...
# LEFT JOIN iceberg.competitive.pricing ON ...
```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Service not running | Check `docker ps`; restart with `docker-compose up -d` |
| `Table not found` | Wrong namespace/table name | Verify with `GET /tables/<namespace>` |
| `Invalid SQL` | PostgreSQL query syntax error | Test query directly in PostgreSQL |
| `S3 access denied` | Wrong credentials | Verify AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY |
| `Out of memory` | Too much data | Reduce batch size; increase Docker memory |
| `Timeout` | Query too slow | Add WHERE clause; use partitioning |

---

## Rate Limiting & Best Practices

- **Sequential loads**: 1-2 MB/sec typical
- **Parallel loads**: 4-8 concurrent tasks recommended
- **Web scraping**: Add 1-2 second delay between requests (rate limiting)
- **Large migrations**: Use batch size of 10K-100K rows
- **Query timeout**: Default 5 minutes; adjust in Trino config

---

## Testing Your API

```bash
# Test Java API health
curl -v http://localhost:8080/api/v1/health

# Test Python API health
curl -v http://localhost:5000/api/v1/health

# Test PostgreSQL connection
docker exec postgres psql -U admin -d source_db -c "SELECT 1"

# Test S3 connection
docker exec localstack awslocal s3 ls

# Test Trino connection
docker exec trino trino --execute "SELECT 1"
```

All APIs are fully functional and production-ready! 🚀