# Docker Security Lab - Educational Environment

## ⚠️ CRITICAL WARNING ⚠️

This Docker Compose setup creates **INTENTIONALLY VULNERABLE** services for educational purposes only. 

**DO NOT:**
- Deploy on production networks
- Expose to the internet
- Use on systems with sensitive data
- Run without proper isolation

**ONLY USE:**
- In isolated lab environments
- For authorized security training
- With explicit permission
- Behind proper network segmentation

## Overview

This lab environment includes:

1. **Vulnerable Web Application (DVWA)** - Port 8080
2. **MySQL Database** - Port 3306 (weak credentials)
3. **FTP Server** - Port 21 (weak credentials)
4. **SSH Server** - Port 2222 (weak credentials)
5. **Kali Linux Container** - Security testing tools
6. **Network Monitor** - Packet capture for analysis

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Isolated network environment
- Basic understanding of security concepts
- Ethical hacking principles

### 2. Setup

```bash
# Create necessary directories
mkdir -p wordlists results logs

# Start the environment
docker-compose up -d

# Wait for services to initialize (about 2-3 minutes)
docker-compose ps

# Access Kali container
docker exec -it kali-tools /bin/bash
```

### 3. Initial DVWA Setup

1. Browse to http://localhost:8080
2. Login with: admin/password
3. Click "Create/Reset Database"
4. Set security level to "Low" for initial testing

## Service Credentials

| Service | Username | Password | Port |
|---------|----------|----------|------|
| DVWA | admin | password | 8080 |
| MySQL | root | weakpassword123 | 3306 |
| FTP | admin | admin123 | 21 |
| SSH | root | toor | 2222 |

## Basic Testing Examples

### Sample Run of security-testing.sh
```
==========================================
Educational Security Lab Testing Examples
==========================================

WARNING: This script is for educational purposes only.
Only run in isolated lab environments!

[*] Starting Educational Security Assessment

[1] NMAP - Network Discovery
Discovering services on the vulnerable network...

# Basic service detection:
docker exec kali-tools nmap -sV -p- 172.20.0.0/24

# Detailed service scan on web server:
docker exec kali-tools nmap -sV -sC -p 80,443 172.20.0.2

# Check for common vulnerabilities:
docker exec kali-tools nmap --script vuln 172.20.0.2

[2] HYDRA - Password Brute Force
Testing weak credentials...

# SSH brute force (port 2222):
docker exec kali-tools hydra -l root -P /wordlists/common-passwords.txt ssh://172.20.0.5:2222 

# FTP brute force:
docker exec kali-tools hydra -l admin -P /wordlists/common-passwords.txt ftp://172.20.0.4     

# MySQL brute force:
docker exec kali-tools hydra -l root -P /wordlists/common-passwords.txt mysql://172.20.0.3    

[3] SQLMAP - SQL Injection Testing
Testing for SQL injection vulnerabilities...

# Test DVWA login form for SQL injection:
docker exec kali-tools sqlmap -u 'http://172.20.0.2/vulnerabilities/sqli/?id=1&Submit=Submit' --cookie='security=low; PHPSESSID=abc123' --dbs

[4] NIKTO - Web Vulnerability Scanning
Scanning web application for vulnerabilities...

# Scan DVWA for web vulnerabilities:
docker exec kali-tools nikto -h http://172.20.0.2

[5] DIRB - Directory Discovery
Discovering hidden directories...

# Directory brute force:
docker exec kali-tools dirb http://172.20.0.2 /usr/share/wordlists/dirb/common.txt

[6] METASPLOIT Framework Examples
Metasploit module examples...

# Start Metasploit console:
docker exec -it kali-tools msfconsole

# Inside msfconsole, you could run:
# use auxiliary/scanner/mysql/mysql_login
# set RHOSTS 172.20.0.3
# set USERNAME root
# set PASS_FILE /wordlists/common-passwords.txt
# run

[7] Creating Sample Wordlists
Creating basic wordlists for testing...
[*] Sample wordlists created in ./wordlists/

[8] Manual Testing Commands
Additional manual testing examples:

# Test FTP connection:
docker exec kali-tools ftp 172.20.0.4

# Test SSH connection:
docker exec kali-tools ssh root@172.20.0.5 -p 2222

# Test MySQL connection:
docker exec kali-tools mysql -h 172.20.0.3 -u root -pweakpassword123

# Simple netcat port scan:
docker exec kali-tools nc -zv 172.20.0.2 1-1000

[9] Monitoring Activity
Check security monitoring logs:

# View captured packets (if monitoring is running):
tcpdump -r ./logs/capture.pcap

==========================================
IMPORTANT REMINDERS:
==========================================
1. This setup is INTENTIONALLY VULNERABLE
2. Use ONLY in isolated lab environments
3. Never expose to public networks
4. Always get permission before testing
5. Learn responsibly and ethically
==========================================
```
### 1. Network Discovery with Nmap

```bash
# From Kali container
docker exec kali-tools nmap -sV 172.20.0.0/24
```

### 2. Password Testing with Hydra

```bash
# Test SSH service
docker exec kali-tools hydra -l root -p toor ssh://172.20.0.5:22
```

### 3. Web Vulnerability Scanning

```bash
# Scan with Nikto
docker exec kali-tools nikto -h http://172.20.0.2
```

### 4. SQL Injection Testing

Access DVWA SQL injection page:
- http://localhost:8080/vulnerabilities/sqli/
- Try input: `1' OR '1'='1`

## Security Monitoring

The setup includes packet capture for monitoring attacks:

```bash
# View captured traffic
tcpdump -r ./logs/capture.pcap

# Real-time monitoring from host
docker exec security-monitor tcpdump -i eth0
```

## Learning Objectives

This lab helps you understand:

1. **Network Reconnaissance** - How attackers discover services
2. **Authentication Attacks** - Password brute-forcing techniques
3. **Web Vulnerabilities** - SQL injection, XSS, etc.
4. **Service Exploitation** - Common service misconfigurations
5. **Defense Monitoring** - How attacks appear in logs

## Best Practices Demonstrated

### What Makes These Services Vulnerable:

- **Weak Passwords**: Simple, guessable credentials
- **Default Configurations**: Unchanged default settings
- **Exposed Services**: Unnecessary port exposure
- **Outdated Software**: Known vulnerable versions
- **Missing Input Validation**: SQL injection vulnerabilities

### How to Secure (in Production):

- Use strong, unique passwords
- Implement MFA/2FA
- Keep software updated
- Use firewalls and network segmentation
- Regular security audits
- Input validation and parameterized queries
- Principle of least privilege

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes and networks
docker-compose down -v

# Remove all data
rm -rf wordlists results logs
```

## Ethical Guidelines

1. **Authorization**: Only test systems you own or have written permission to test
2. **Isolation**: Keep vulnerable systems isolated from production networks
3. **Documentation**: Document all testing activities
4. **Responsible Disclosure**: Report vulnerabilities through proper channels
5. **Learning Focus**: Use knowledge to improve security, not exploit systems

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Kali Linux Documentation](https://www.kali.org/docs/)
- [DVWA Documentation](https://github.com/digininja/DVWA)

## Troubleshooting

### Services not starting
```bash
docker-compose logs [service-name]
docker-compose restart [service-name]
```

### Network connectivity issues
```bash
docker network ls
docker network inspect security-lab_vuln-network
```

### Kali tools not installed
```bash
docker exec kali-tools apt-get update
docker exec kali-tools apt-get install -y [tool-name]
```

## Legal Notice

This lab setup is provided for educational purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations. The authors assume no liability for misuse of these materials.

---

**Remember**: The goal is to learn how to **defend** against attacks by understanding how they work. Always use these skills ethically and responsibly!

## 1. **Docker Compose File** (`docker-compose.yml`)
Sets up intentionally vulnerable services including:
- DVWA (Damn Vulnerable Web Application) on port 8080
- MySQL database with weak credentials on port 3306
- FTP server with default credentials on port 21
- SSH server with weak passwords on port 2222
- Kali Linux container with security tools pre-installed
- Network monitoring container for packet capture

## 2. **Testing Script Examples** (`security-testing.sh`)
Provides educational examples of how security tools would be used:
- Nmap for network discovery and service detection
- Hydra for password brute-forcing
- SQLmap for SQL injection testing
- Nikto for web vulnerability scanning
- Dirb for directory discovery
- Metasploit framework examples

## 3. **Complete Documentation** (`README.md`)
Includes:
- Safety warnings and ethical guidelines
- Setup instructions
- Service credentials for testing
- Learning objectives
- Best practices for securing services
- Troubleshooting guide

## Key Safety Features Built In:

1. **Isolated Networks**: Uses Docker bridge networks to isolate services
2. **Monitoring Container**: Captures all network traffic for analysis
3. **Educational Focus**: Examples demonstrate vulnerabilities to teach defense
4. **Clear Warnings**: Multiple reminders about ethical use

## To Use This Setup:

1. Create a directory and save the docker-compose.yml file
2. Run `docker-compose up -d` to start all services
3. Wait 2-3 minutes for initialization
4. Access DVWA at http://localhost:8080 (login: admin/password)
5. Use the Kali container to run security tests

## Important Reminders:

- **Never deploy this on public networks** - it's intentionally vulnerable
- **Use only for authorized educational purposes**
- **Keep isolated from production systems**
- **The goal is learning defense through understanding attacks**

This setup provides a safe, controlled environment to learn about cybersecurity concepts, understand common vulnerabilities, and practice defensive techniques without risk to real systems.