#!/usr/bin/env python3
import requests
import time
from datetime import datetime
import json

PRIMARY_URL = "http://primary/health"
BACKUP_URL = "http://backup/health"
LB_URL = "http://lb"

def check_health(url, name):
    """Check if a service is healthy"""
    try:
        response = requests.get(url, timeout=2)
        is_healthy = response.status_code == 200
        return is_healthy, response.status_code
    except requests.exceptions.RequestException as e:
        return False, str(e)

def log_status(primary_status, backup_status, active_route):
    """Log the current status"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n[{timestamp}] Health Check Report")
    print("=" * 60)
    print(f"Primary Server:  {'🟢 UP' if primary_status[0] else '🔴 DOWN'} ({primary_status[1]})")
    print(f"Backup Server:   {'🟢 UP' if backup_status[0] else '🔴 DOWN'} ({backup_status[1]})")
    print(f"Active Route:    {active_route}")
    print("=" * 60)

def determine_active_route(primary_up, backup_up):
    """Determine which server should be active"""
    if primary_up:
        return "PRIMARY"
    elif backup_up:
        return "BACKUP (Failover Active)"
    else:
        return "BOTH DOWN - NO SERVICE"

def main():
    print("Starting Health Monitor...")
    print("Monitoring Primary: http://primary")
    print("Monitoring Backup:  http://backup")
    print("Load Balancer:      http://lb")
    
    check_count = 0
    while True:
        try:
            primary_status = check_health(PRIMARY_URL, "Primary")
            backup_status = check_health(BACKUP_URL, "Backup")
            active_route = determine_active_route(primary_status[0], backup_status[0])
            
            check_count += 1
            log_status(primary_status, backup_status, active_route)
            
            # Try to reach LB
            try:
                lb_response = requests.get(LB_URL, timeout=2)
                print(f"\nLoad Balancer Test: ✓ Responding ({lb_response.status_code})")
            except Exception as e:
                print(f"\nLoad Balancer Test: ✗ Error ({str(e)})")
            
        except Exception as e:
            print(f"Error during health check: {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    main()