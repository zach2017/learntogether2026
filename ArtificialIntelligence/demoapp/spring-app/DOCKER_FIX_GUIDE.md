# 🔧 Docker Compose Startup - Troubleshooting & Fixes

## Fixed Issues

The docker-compose configuration has been improved with:

✅ **Proper Health Checks** - Services wait for dependencies to be healthy  
✅ **Better Startup Order** - Correct dependency ordering with health conditions  
✅ **Container Names** - Named containers for easier debugging  
✅ **Restart Policies** - Auto-restart unless explicitly stopped  
✅ **Network** - Explicit bridge network for service communication  
✅ **Initialization** - LocalStack auto-init script for S3/SQS  
✅ **Error Handling** - Python service with retry logic  
✅ **Verbose Logging** - Better debugging information  

---

## 🚀 Quick Start

### Option 1: Simple Start
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Clean Start (if having issues)
```bash
chmod +x start.sh
./start.sh clean
```

### Option 3: Manual Start with Logs
```bash
docker-compose up --build
```

---

## 📊 Startup Order

Services now start in the correct order:

```
1. LocalStack (AWS S3 & SQS)
   └─ Health Check: curl http://localhost:4566/_localstack/health
   
2. PostgreSQL (Database)
   └─ Health Check: pg_isready -U docuser -d document_db
   
3. Spring Boot API
   └─ Depends on: LocalStack ✓ + PostgreSQL ✓
   └─ Health Check: GET /api/documents
   
4. Python Service
   └─ Depends on: LocalStack ✓ + Spring ✓
   └─ Starts processing documents
```

---

## ✨ New Features

### Auto-Init Script
```bash
./docker/localstack-init.sh
```
Automatically creates:
- S3 bucket: `documents`
- SQS queue: `document-queue`

### Health Checks
Each service has health checks that prevent dependent services from starting until it's ready:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/api/documents"]
  interval: 5s
  timeout: 5s
  retries: 20
  start_period: 30s
```

### Better Python Service
- ✅ Retry logic for AWS connections (10 attempts)
- ✅ Exponential backoff for API calls
- ✅ Auto-reconnect on failures
- ✅ Better error logging
- ✅ Status line separators for readability

---

## 🔍 Debugging

### Check Service Status
```bash
chmod +x check-health.sh
./check-health.sh
```

This will:
- ✅ Verify Docker installation
- ✅ Check all service containers
- ✅ Test port connectivity
- ✅ Verify service health
- ✅ Check database tables
- ✅ Check S3 buckets
- ✅ Check SQS queues
- ✅ Show recent errors
- ✅ Provide recommendations

### View Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker-compose logs -f spring-app
docker-compose logs -f python-summary-service
docker-compose logs -f postgres
docker-compose logs -f localstack
```

**Last 50 lines:**
```bash
docker-compose logs --tail=50
```

**Specific time range:**
```bash
docker-compose logs --since=10m
```

---

## 🔧 Common Issues & Fixes

### Issue: "Port 8080 already in use"

**Solution 1: Stop other services**
```bash
lsof -i :8080
kill -9 <PID>
```

**Solution 2: Use different port**
```yaml
# docker-compose.yml
spring-app:
  ports:
    - "8081:8080"  # Use 8081 instead
```

### Issue: "Cannot connect to LocalStack"

**Cause:** LocalStack not ready yet  
**Fix:** Wait longer, it can take 15-30 seconds

```bash
# Check if LocalStack is responding
curl http://localhost:4566/_localstack/health

# View LocalStack logs
docker-compose logs localstack
```

### Issue: "Spring app won't start"

**Check:**
```bash
docker-compose logs spring-app | tail -30
```

**Common causes:**
- Database not ready → Wait for PostgreSQL
- LocalStack not ready → Wait for LocalStack
- Port already in use → Change port
- Out of memory → Increase Docker memory

### Issue: "Python service errors when starting"

**Expected behavior:** Python service will retry connecting to LocalStack/Spring API

```
Connection attempt 1 failed: Connection refused
Connection attempt 2 failed: Connection refused
Waiting 5 seconds before retry...
```

This is normal - it will eventually connect.

### Issue: "Documents table doesn't exist"

**Cause:** Spring app hasn't run migrations yet  
**Fix:** Wait longer or check Spring app logs

```bash
docker-compose exec postgres psql -U docuser -d document_db
```

Then check for tables:
```sql
\dt
```

---

## 🚀 Advanced Commands

### Stop All Services
```bash
docker-compose stop
```

### Restart Specific Service
```bash
docker-compose restart spring-app
```

### Clean Everything (including data)
```bash
docker-compose down -v
./start.sh  # Start fresh
```

### Execute Command in Container
```bash
# Run database query
docker-compose exec postgres psql -U docuser -d document_db -c "SELECT * FROM documents;"

# View Python logs
docker-compose exec python-summary-service cat /tmp/debug.log

# Interactive bash
docker-compose exec spring-app /bin/bash
```

### View Resource Usage
```bash
docker stats
```

### Rebuild Images
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 📋 Startup Checklist

- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Docker daemon running: `docker info`
- [ ] Ports available: `lsof -i :8080`
- [ ] Start services: `./start.sh`
- [ ] Wait 30-60 seconds
- [ ] Check health: `./check-health.sh`
- [ ] Open browser: `http://localhost:8080`
- [ ] Upload test document
- [ ] Check logs: `docker-compose logs -f`

---

## 📊 Expected Output

### Startup Output
```
✓ Docker and Docker Compose detected
✓ All ports available
Starting services...
✓ Services started
Waiting for services to be ready...
✓ LocalStack is ready
✓ PostgreSQL is ready
✓ Spring Boot API is ready
✓ All services running!
```

### Logs Should Show

**LocalStack:**
```
=== LocalStack Initialization Complete ===
✓ S3 bucket ready
✓ SQS Queue created
```

**Spring:**
```
Starting DocumentUploadApplication...
Hibernate: create table documents...
Server started on port 8080
```

**Python Service:**
```
Starting Document Processor Service...
Initializing AWS clients...
✓ All AWS clients initialized successfully
Beginning to poll SQS queue...
```

---

## 🎯 Verification Steps

### 1. Check Services Running
```bash
docker-compose ps
```

Expected output:
```
NAME                           STATUS      PORTS
document_localstack            Up (healthy)  0.0.0.0:4566->4566/tcp
document_postgres              Up (healthy)  0.0.0.0:5432->5432/tcp
document_spring_app            Up (healthy)  0.0.0.0:8080->8080/tcp
document_python_service        Up           (no ports)
```

### 2. Test API
```bash
curl http://localhost:8080/api/documents
```

Expected response:
```json
[]
```

### 3. Check Database
```bash
docker-compose exec postgres psql -U docuser -d document_db -c "SELECT COUNT(*) FROM documents;"
```

Expected output:
```
 count
-------
     0
(1 row)
```

### 4. Check S3
```bash
aws s3 ls --endpoint-url http://localhost:4566
```

Expected output:
```
2024-01-15 10:30:00 documents
```

### 5. Check SQS
```bash
aws sqs list-queues --endpoint-url http://localhost:4566
```

Expected output:
```json
{
  "QueueUrls": [
    "http://localhost:4566/000000000000/document-queue"
  ]
}
```

---

## 🆘 Get Help

1. **Read logs:**
   ```bash
   docker-compose logs
   ```

2. **Run health check:**
   ```bash
   ./check-health.sh
   ```

3. **Clean and restart:**
   ```bash
   ./start.sh clean
   ```

4. **Check specific service:**
   ```bash
   docker-compose logs service-name
   ```

5. **Last resort - nuclear option:**
   ```bash
   docker-compose down -v
   docker system prune
   ./start.sh
   ```

---

## 📈 Performance Tips

### Increase Memory (if getting OOM)
```yaml
# docker-compose.yml
spring-app:
  environment:
    JAVA_OPTS: "-Xmx2G -Xms512M"
```

### Increase Database Connections
```yaml
postgres:
  command: postgres -c max_connections=500
```

### Increase File Upload Limit
```yaml
spring-app:
  environment:
    - SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=500MB
```

---

## ✅ Everything Should Work!

The updated docker-compose configuration has been tested and fixed to handle:
- ✅ Proper startup ordering
- ✅ Health checks at each stage
- ✅ Automatic retries
- ✅ Service auto-restart
- ✅ LocalStack initialization
- ✅ Database schema creation
- ✅ Python service retry logic
- ✅ Better error messages

**Start with:**
```bash
chmod +x start.sh
./start.sh
```

Then visit: **http://localhost:8080**

---

## 📞 Support

All services now have:
- ✅ Health checks that prevent startup issues
- ✅ Auto-restart on failure
- ✅ Proper error logging
- ✅ Dependency management
- ✅ Timeout configuration
- ✅ Retry logic

If services still don't start:

1. Run `./check-health.sh`
2. Check `docker-compose logs`
3. Try `./start.sh clean`
4. Restart Docker daemon
5. Check disk space: `df -h`
