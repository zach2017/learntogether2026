# Create directory structure
mkdir -p failover-demo/{primary_html,backup_html}
cd failover-demo

# Copy all files into their respective locations
# (Use the contents above to create each file)

# Start the system
docker-compose up -d

# Watch the health monitor
docker-compose logs -f health_monitor

# Test endpoints
curl http://localhost/health
curl http://localhost/status

# Simulate primary failure
docker-compose stop primary

# View automatic failover
docker-compose logs -f health_monitor

# Restart
docker-compose start primary
docker-compose down