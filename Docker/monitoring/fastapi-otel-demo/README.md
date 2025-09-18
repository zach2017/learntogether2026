# Demo Monitoring

Allocation Summary:



| Service | External Port | Internal Port | URL |
|---------|---------------|---------------|-----|
| Backend | 8000 | 8000 | http://localhost:8000 |
| Frontend | 3001 | 80 | http://localhost:3001 |
| cAdvisor | 8081 | 8080 | http://localhost:8081 |
| Node Exporter | 9100 | 9100 | http://localhost:9100 |
| Prometheus | 9090 | 9090 | http://localhost:9090 |
| Grafana | 3000 | 3000 | http://localhost:3000 |
| Tempo | 3200 | 3200 | http://localhost:3200 |
| OTel Collector | 8889, 4318, 9445 | 8889, 4318, 4317 | http://localhost:8889/metrics |

## Deploy the Fixed Configuration:

```bash
# Stop any running containers
docker-compose down

# Start with the fixed configuration
docker-compose up -d
```

## Verify Everything is Running:

```bash
# Check all containers are up
docker-compose ps

# Check if ports are accessible
curl http://localhost:3001  # Frontend
curl http://localhost:8081  # cAdvisor UI
curl http://localhost:9100/metrics  # Node Exporter
curl http://localhost:8000/metrics  # Backend metrics
```

## Check Prometheus Targets:

Go to `http://localhost:9090/targets` to verify all targets are UP:
- ✅ prometheus (localhost:9090)
- ✅ otel-collector (otel-collector:8889)
- ✅ backend (backend:8000)
- ✅ cadvisor (cadvisor:8080) - Note: internal port
- ✅ node-exporter (node-exporter:9100)
- ✅ grafana (grafana:3000)

## Alternative: If you still have port conflicts

If you have other services using these ports, you can check what's using them:

```bash
# Check what's using specific ports
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :3001

# Or on macOS/newer systems
sudo lsof -i :8080
sudo lsof -i :3001
```

# Complete Verification Guide: cURL Commands and Prometheus Queries

## 1. Verify All Metrics Endpoints with cURL

### Backend Application Metrics
```bash
# Check if backend metrics endpoint exists
curl -I http://localhost:8000/metrics

# Get all backend metrics
curl -s http://localhost:8000/metrics

# Filter specific backend metrics
curl -s http://localhost:8000/metrics | grep http_requests_total
curl -s http://localhost:8000/metrics | grep db_operations_total
curl -s http://localhost:8000/metrics | grep items_created_total
curl -s http://localhost:8000/metrics | grep active_requests
```

### OpenTelemetry Collector Metrics
```bash
# Get all OTel Collector metrics
curl -s http://localhost:8889/metrics

# OTel Collector health and performance
curl -s http://localhost:8889/metrics | grep otelcol_receiver
curl -s http://localhost:8889/metrics | grep otelcol_exporter
curl -s http://localhost:8889/metrics | grep otelcol_processor

# System metrics (if hostmetrics receiver is enabled)
curl -s http://localhost:8889/metrics | grep system_
curl -s http://localhost:8889/metrics | grep container_
```

### cAdvisor Container Metrics
```bash
# Get all container metrics
curl -s http://localhost:8081/metrics

# Container CPU metrics
curl -s http://localhost:8081/metrics | grep container_cpu
curl -s http://localhost:8081/metrics | grep container_memory
curl -s http://localhost:8081/metrics | grep container_network
curl -s http://localhost:8081/metrics | grep container_fs

# Show metrics for specific containers
curl -s http://localhost:8081/metrics | grep 'name="demo_backend"'
curl -s http://localhost:8081/metrics | grep 'name="demo_db"'
```

### Node Exporter Host Metrics
```bash
# Get all host system metrics
curl -s http://localhost:9100/metrics

# CPU metrics
curl -s http://localhost:9100/metrics | grep node_cpu
curl -s http://localhost:9100/metrics | grep node_load

# Memory metrics
curl -s http://localhost:9100/metrics | grep node_memory

# Disk metrics
curl -s http://localhost:9100/metrics | grep node_disk
curl -s http://localhost:9100/metrics | grep node_filesystem

# Network metrics
curl -s http://localhost:9100/metrics | grep node_network
```

### Prometheus Self-Monitoring
```bash
# Prometheus internal metrics
curl -s http://localhost:9090/metrics | grep prometheus_
curl -s http://localhost:9090/metrics | grep promhttp_
```

### Grafana Metrics
```bash
# Grafana metrics
curl -s http://localhost:3000/metrics | grep grafana_
```

## 2. Generate Test Data

Before querying, generate some traffic to populate metrics:

```bash
# Generate backend traffic
for i in {1..10}; do
  echo "Creating item $i..."
  curl -X POST http://localhost:8000/items \
    -H "Content-Type: application/json" \
    -d "{\"product\": \"item$i\", \"price\": $((RANDOM % 100 + 10)), \"cart\": \"cart$((i % 3 + 1))\", \"qty\": $((RANDOM % 5 + 1))}"
  
  curl -s http://localhost:8000/items > /dev/null
  curl -s http://localhost:8000/health > /dev/null
  
  # Add some errors
  if [ $((i % 4)) -eq 0 ]; then
    curl -s http://localhost:8000/items/999 > /dev/null  # 404 error
  fi
  
  sleep 1
done

echo "Traffic generation complete!"
```

## 3. Prometheus Query Examples

Access Prometheus at `http://localhost:9090/graph` and try these queries:

### Backend Application Queries

**HTTP Request Rate:**
```promql
rate(http_requests_total[5m])
```

**HTTP Request Rate by Endpoint:**
```promql
sum by (endpoint) (rate(http_requests_total[5m]))
```

**HTTP Request Rate by Status Code:**
```promql
sum by (status_code) (rate(http_requests_total[5m]))
```

**Error Rate (4xx and 5xx):**
```promql
sum(rate(http_requests_total{status_code=~"[45].."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

**95th Percentile Response Time:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Average Response Time:**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Active Requests:**
```promql
active_requests
```

**Database Operations Rate:**
```promql
rate(db_operations_total[5m])
```

**Database Operations by Type:**
```promql
sum by (operation) (rate(db_operations_total[5m]))
```

**Items Created per Minute:**
```promql
rate(items_created_total[5m]) * 60
```

### Container Metrics (cAdvisor)

**Container CPU Usage by Container:**
```promql
rate(container_cpu_usage_seconds_total{name!=""}[5m]) * 100
```

**Container Memory Usage (MB):**
```promql
container_memory_usage_bytes{name!=""} / 1024 / 1024
```

**Container Memory Usage Percentage:**
```promql
(container_memory_usage_bytes{name!=""} / container_spec_memory_limit_bytes{name!=""}) * 100
```

**Container Network Receive Rate:**
```promql
rate(container_network_receive_bytes_total{name!=""}[5m])
```

**Container Network Transmit Rate:**
```promql
rate(container_network_transmit_bytes_total{name!=""}[5m])
```

**Container Disk Read Rate:**
```promql
rate(container_fs_reads_bytes_total{name!=""}[5m])
```

**Container Disk Write Rate:**
```promql
rate(container_fs_writes_bytes_total{name!=""}[5m])
```

**Top 5 CPU Consuming Containers:**
```promql
topk(5, rate(container_cpu_usage_seconds_total{name!=""}[5m]) * 100)
```

**Top 5 Memory Consuming Containers:**
```promql
topk(5, container_memory_usage_bytes{name!=""} / 1024 / 1024)
```

### Host System Metrics (Node Exporter)

**CPU Usage by Mode:**
```promql
rate(node_cpu_seconds_total[5m]) * 100
```

**Overall CPU Usage:**
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Memory Usage Percentage:**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

**Memory Usage (GB):**
```promql
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024 / 1024
```

**Disk Usage Percentage:**
```promql
(node_filesystem_size_bytes{fstype!="tmpfs"} - node_filesystem_avail_bytes{fstype!="tmpfs"}) / node_filesystem_size_bytes{fstype!="tmpfs"} * 100
```

**Disk I/O Read Rate:**
```promql
rate(node_disk_read_bytes_total[5m])
```

**Disk I/O Write Rate:**
```promql
rate(node_disk_written_bytes_total[5m])
```

**Network Interface Traffic:**
```promql
rate(node_network_receive_bytes_total{device!="lo"}[5m])
```

**System Load Average:**
```promql
node_load1
node_load5
node_load15
```

**Available Disk Space (GB):**
```promql
node_filesystem_avail_bytes{fstype!="tmpfs"} / 1024 / 1024 / 1024
```

### OpenTelemetry Collector Metrics

**OTel Collector Memory Usage:**
```promql
otelcol_process_memory_rss
```

**Spans Received Rate:**
```promql
rate(otelcol_receiver_accepted_spans_total[5m])
```

**Spans Exported Rate:**
```promql
rate(otelcol_exporter_sent_spans_total[5m])
```

**Failed Exports:**
```promql
rate(otelcol_exporter_send_failed_spans_total[5m])
```

**Batch Processor Queue Size:**
```promql
otelcol_processor_batch_batch_send_size
```

### Combined Queries

**Service Availability:**
```promql
up
```

**Services Up Count:**
```promql
sum(up)
```

**Request Rate Across All Services:**
```promql
sum(rate(http_requests_total[5m]))
```

**Total Error Rate:**
```promql
sum(rate(http_requests_total{status_code=~"[45].."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

## 4. Verification Script

Save this as `verify_monitoring.sh`:## 5. Run the Verification

```bash
# Make the script executable
chmod +x verify_monitoring.sh

# Run verification
./verify_monitoring.sh
```

## 6. Quick Dashboard Queries

For a quick overview, paste these queries in Prometheus (`http://localhost:9090/graph`):

### System Overview Dashboard Queries:

1. **Service Availability**: `up`
2. **HTTP Request Rate**: `sum(rate(http_requests_total[5m]))`
3. **Error Rate**: `sum(rate(http_requests_total{status_code=~"[45].."}[5m])) / sum(rate(http_requests_total[5m])) * 100`
4. **CPU Usage**: `100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`
5. **Memory Usage**: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
6. **Container Memory**: `sum(container_memory_usage_bytes{name!=""}) / 1024 / 1024`

## 7. Expected Results

After running the verification, you should see:
- ✅ All containers running
- ✅ All metrics endpoints accessible
- ✅ Prometheus targets showing "UP"
- ✅ Metrics data flowing from all sources
- ✅ Backend API functional

If any checks fail, check the container logs:
```bash
docker-compose logs [service-name]
```

## Deploy and Test:

1. **Deploy the updated stack:**
```bash
docker-compose down
docker-compose up -d
```

2. **Verify all services are running:**
```bash
docker-compose ps
```

3. **Check Prometheus targets:**
Go to `http://localhost:9090/targets` - you should see all targets as "UP":
- prometheus
- otel-collector
- backend
- cadvisor
- node-exporter
- grafana

## Test Metrics Endpoints:

```bash
# Container metrics from cAdvisor
curl -s http://localhost:8080/metrics | grep container_

# Host metrics from Node Exporter
curl -s http://localhost:9100/metrics | grep node_

# OTel Collector (app + system metrics)
curl -s http://localhost:8889/metrics | grep -E "(system_|container_)"

# Backend application metrics
curl -s http://localhost:8000/metrics | grep http_requests_total
```

## Useful Prometheus Queries:

### **Container Metrics (cAdvisor):**
```promql
# Container CPU usage per container
rate(container_cpu_usage_seconds_total{name!=""}[5m]) * 100

# Container memory usage
container_memory_usage_bytes{name!=""} / 1024 / 1024

# Container network traffic
rate(container_network_receive_bytes_total[5m])
```

### **Host System Metrics (Node Exporter):**
```promql
# CPU usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
(node_filesystem_size_bytes{fstype!="tmpfs"} - node_filesystem_avail_bytes{fstype!="tmpfs"}) / node_filesystem_size_bytes{fstype!="tmpfs"} * 100
```

### **Application Metrics (Backend):**
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
sum(rate(http_requests_total{status_code=~"[45].."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```
