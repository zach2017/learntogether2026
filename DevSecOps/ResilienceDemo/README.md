# Failover System Setup & Issues Guide Summary

[The article discusses operational resilience and disaster recovery strategies](https://www.thestack.technology/operational-resilience-and-stress-testing-for-wartime), highlighting lessons from the 2024 CrowdStrike IT outages. Key points include:  https://www.thestack.technology/operational-resilience-and-stress-testing-for-wartime

**Main Insights:**
- **Monzo's Stand-In System**: A completely separate backup system running on Google Cloud (while primary runs on AWS) that costs only 1% of the main infrastructure
- **Focus on Core Functions**: The backup only runs 18 essential services vs 3,000 in production, focusing on critical operations like spending and account balances
- **Common Failures**: Organizations often fail because they don't stress-test backups in "wartime" conditions, IT staff don't understand what's mission-critical, and DR plans become outdated
- **Key Success Factors**: Understanding critical assets, continuous reassessment, knowing "patient zero" in incidents, and thinking beyond just hardware failures to include software bugs

# Failover Demo System

A Docker-based demonstration of operational resilience with automatic failover.

## Quick Start
```bash
# Build and start
docker-compose up -d

# View health monitoring
docker-compose logs -f health_monitor

# Visit in browser
# http://localhost - Load balanced (routes to primary or backup)
# http://localhost:8001 - Direct primary
# http://localhost:8002 - Direct backup
```

## Testing Failover
```bash
# Stop primary and watch automatic failover to backup
docker-compose stop primary

# View logs to see the switch
docker-compose logs -f health_monitor

# Restart primary
docker-compose start primary
```

## Endpoints

- `http://localhost/` - Load balanced access
- `http://localhost:8001/` - Direct primary access
- `http://localhost:8002/` - Direct backup access
- `http://localhost/health` - Health check
- `http://localhost/status` - Load balancer status

## Services

- **Primary**: Main Nginx server (green interface)
- **Backup**: Standby Nginx server (orange interface)
- **LB**: Load balancer with failover logic
- **Health Monitor**: Python service monitoring all servers

## Cleanup
```bash
docker-compose down
```

## Summary: Operational Resilience & Failover Architecture

The article highlights how the 2024 CrowdStrike outages exposed gaps in business disaster recovery (DR) strategies. Key insights:

- **Monzo's Stand-In**: A completely separate backup system on Google Cloud that can activate when AWS fails. It runs only 18 core services (vs 3,000 in primary), keeping costs at ~1% of main system.
- **Core Problem**: IT teams often don't understand what's truly mission-critical to their business.
- **Key Lesson**: Focus resilience efforts on core functions only, not entire systems.
- **Regulation**: DORA (Digital Operational Resilience Act, Jan 2025) forces companies to test recovery capabilities—85% aren't prepared.

---

## Setup Instructions

### 1. Create Directory Structure
```bash
mkdir failover-demo
cd failover-demo
mkdir primary_html backup_html
```

### 2. Create Primary Server HTML
**primary_html/index.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Primary Server</title>
    <style>
        body { font-family: Arial; background: #d4edda; padding: 50px; }
        .status { border: 2px solid green; padding: 20px; border-radius: 5px; }
        h1 { color: green; }
    </style>
</head>
<body>
    <div class="status">
        <h1>🟢 PRIMARY SERVER ACTIVE</h1>
        <p>Timestamp: <span id="time"></span></p>
        <p>Server: Primary (AWS)</p>
        <p>Status: Operational</p>
        <button onclick="testConnection()">Test Connection</button>
    </div>
    <script>
        setInterval(() => {
            document.getElementById('time').innerText = new Date().toLocaleTimeString();
        }, 1000);
        function testConnection() { alert('Primary responding normally'); }
    </script>
</body>
</html>
```

**primary_html/health**
```
OK
```

### 3. Create Backup Server HTML
**backup_html/index.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Backup Server</title>
    <style>
        body { font-family: Arial; background: #fff3cd; padding: 50px; }
        .status { border: 2px solid orange; padding: 20px; border-radius: 5px; }
        h1 { color: orange; }
    </style>
</head>
<body>
    <div class="status">
        <h1>🟡 BACKUP SERVER ACTIVE</h1>
        <p>Timestamp: <span id="time"></span></p>
        <p>Server: Backup (Google Cloud)</p>
        <p>Status: Standby/Failover Mode</p>
        <p><strong>⚠️ Limited functionality (core services only)</strong></p>
        <button onclick="testConnection()">Test Connection</button>
    </div>
    <script>
        setInterval(() => {
            document.getElementById('time').innerText = new Date().toLocaleTimeString();
        }, 1000);
        function testConnection() { alert('Backup responding in failover mode'); }
    </script>
</body>
</html>
```

**backup_html/health**
```
OK
```

### 4. Create nginx_lb.conf
Save the Nginx load balancer configuration from the artifacts above.

### 5. Create health_monitor.py
Save the Python health monitor script from the artifacts above.

### 6. Run the System
```bash
docker-compose up -d
```

### 7. Test It
- **Normal operation**: Visit `http://localhost` → you'll see PRIMARY
- **Check health**: `curl http://localhost/health`
- **Check status**: `curl http://localhost/status`
- **Direct access**: 
  - Primary: `http://localhost:8001`
  - Backup: `http://localhost:8002`

### 8. Simulate Primary Failure
```bash
# Stop primary server
docker-compose stop primary

# Now visit http://localhost - you'll see BACKUP
# The load balancer automatically routes to backup

# To recover
docker-compose start primary
```

---

## Critical Failover Issues & Limitations

### 1. **Session Loss During Failover**
- **Problem**: User sessions stored in primary memory are lost when switching to backup
- **Impact**: Users get logged out, shopping carts cleared, unsaved work lost
- **Solution**: Use external session storage (Redis/Memcached), not in-memory sessions

### 2. **Data Consistency Issues**
- **Problem**: Backup may not have latest database updates if failover happens mid-transaction
- **Impact**: Data corruption, duplicate transactions, lost updates
- **Solution**: Real-time database replication (multi-master, streaming replication)

### 3. **Split-Brain Problem**
- **Problem**: Both primary and backup claim to be active, accepting writes
- **Impact**: Conflicting data, loss of transactions, integrity issues
- **Solution**: Implement quorum-based consensus or external lock service

### 4. **Detection Latency**
- **Problem**: Takes time to detect primary is down (5-10 seconds typically)
- **Impact**: Requests fail during detection window, user-facing errors
- **Solution**: Reduce timeout values (risky - causes false positives) or use active health checks

### 5. **Sticky Connections Problem**
- **Problem**: Long-lived connections (WebSockets, streaming) break on failover
- **Impact**: Real-time features fail (chat, notifications, live updates)
- **Solution**: Implement connection reconnection logic on client-side

### 6. **DNS Caching**
- **Problem**: DNS results cached by clients/systems, pointing to old IP
- **Impact**: Requests still route to dead server despite failover
- **Solution**: Use low TTL values, or service mesh with client-side load balancing

### 7. **Database Failover Complexity**
- **Problem**: Unlike stateless servers, databases can't simply fail over without data sync
- **Impact**: Backup database may be stale or have conflicting state
- **Solution**: Monzo's approach - keep backup simple with only critical data

### 8. **Cascading Failures**
- **Problem**: If backup overloads from all traffic, it crashes too
- **Impact**: Complete service outage
- **Solution**: Rate limiting, circuit breakers, graceful degradation

### 9. **Monitoring Blind Spots**
- **Problem**: Monitor itself could fail; who monitors the monitors?
- **Impact**: Failover never triggers because detection failed
- **Solution**: Distributed consensus checks, multiple independent monitors

### 10. **Backup Staleness**
- **Problem**: Backup features fall behind primary over time
- **Issue**: Canary deployments only on primary, backup never updated
- **Impact**: Users on backup get outdated/broken experience
- **Solution**: Test backup regularly, deploy simultaneously to both

### 11. **Cost vs. Coverage Trade-off**
- **Problem**: True redundancy is expensive; most cut corners
- **Impact**: "Backup" isn't really independent, shares failure modes
- **Real-world**: Many backups in same AWS region or same code base

### 12. **Operator Error During Failover**
- **Problem**: Manual failover steps might be incomplete or executed incorrectly
- **Impact**: Data loss, extended downtime
- **Solution**: Automation first, manual as last resort

---

## What Monzo Does Right

From the article, Monzo's Stand-In solves several issues:

✅ **True Independence**: Separate cloud provider (GCP vs AWS)
✅ **Minimal Complexity**: Only 18 essential services vs 3,000
✅ **Cost Effective**: 1% overhead of primary system
✅ **Proven**: Activated during 2024 UK bank slowdown
✅ **Tested**: Not sitting "on a shelf" - regularly validated

## Testing Commands

```bash
# View logs
docker-compose logs -f health_monitor

# Stop primary and watch failover
docker-compose stop primary
docker-compose logs -f health_monitor

# Test from outside
watch -n 1 'curl -s http://localhost/status'

# Simulate slow response (chaos engineering)
docker exec primary nginx -s reload  # Affects primary
```

---

## Key Takeaway

**Real failover is hard.** The article's key point: most companies focus on the wrong things. They over-engineer complex systems instead of:
1. Understanding what's truly mission-critical
2. Building lean backup systems for just that
3. Actually testing them regularly
4. Making sure everyone knows the plan

DORA legislation is forcing this conversation - 85% of companies aren't ready.