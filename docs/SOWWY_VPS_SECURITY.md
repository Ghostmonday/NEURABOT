# Sowwy VPS Deployment Security Guide

**Comprehensive security measures for production VPS deployment**

This guide covers everything you need to secure your Sowwy instance on a remote VPS without micromanagement. The system is designed with defense-in-depth principles.

---

## 🎯 Security Philosophy

Sowwy implements **Zero Trust** security:
- **Default-deny**: Everything blocked unless explicitly allowed
- **Least privilege**: Minimal permissions for each component
- **Human-in-the-loop**: Critical actions require approval
- **Secrets isolation**: Credentials never exposed in logs or code

---

## 🔐 Secrets Management (Critical)

### The Golden Rule
**NEVER commit `.env` files or credentials to version control.**

```bash
# .env is already in .gitignore - verify this
cat .gitignore | grep -E "^\.env"
# Should output: .env

# Your actual credentials stay ONLY on:
# 1. Your local machine (.env file)
# 2. Hostinger VPS (via secure env vars or secrets manager)
# 3. NEVER in git, CI/CD, or public repos
```

### VPS Secrets Deployment

```bash
# Option 1: Environment file (least secure)
scp .env user@vps:/home/sowwy/.env

# Option 2: Environment variables (recommended)
ssh user@vps
# Add to /etc/environment or systemd service:
# MINIMAX_API_KEY=sk-cp-...
# SOWWY_POSTGRES_PASSWORD=...

# Option 3: Docker secrets (most secure)
echo "your-secret" | docker secret create sowwy_minimax_key -
```

### Secrets That Must Be Protected

| Secret | Protection Level | Rotation Frequency |
|--------|-----------------|-------------------|
| `MINIMAX_API_KEY` | Critical | If leaked |
| `SOWWY_POSTGRES_PASSWORD` | Critical | Monthly |
| `SOWWY_JWT_SECRET` | Critical | Weekly |
| `HOSTINGER_API_TOKEN` | Critical | If leaked |

---

## 🧱 Firewall Configuration

### UFW (Uncomplicated Firewall) Setup

```bash
# Install
sudo apt update && sudo apt install ufw -y

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port for security through obscurity)
sudo ufw allow 2222/tcp comment "SSH"

# Allow HTTPS only (Sowwy web interface)
sudo ufw allow 443/tcp comment "HTTPS"

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status verbose
```

### iptables (Advanced)

```bash
# Drop everything by default
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from your IP only
sudo iptables -A INPUT -s YOUR_IP/32 -p tcp --dport 2222 -j ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Drop invalid packets
sudo iptables -A INPUT -m state --state INVALID -j DROP

# Save rules
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

---

## 🔑 SSH Hardening

### Disable Password Authentication

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Ensure these settings:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
PermitEmptyPasswords no

# Restart SSH
sudo systemctl restart sshd
```

### SSH Key Setup

```bash
# Generate key on LOCAL machine (not VPS!)
ssh-keygen -t ed25519 -C "sowwy-vps"

# Copy public key to VPS
ssh-copy-id -p 2222 user@vps

# Test connection
ssh -p 2222 user@vps

# Add to .ssh/config for easy access
Host sowwy
    HostName vps-ip
    Port 2222
    User username
    IdentityFile ~/.ssh/sowwy-vps_ed25519
```

### Fail2ban Installation

```bash
sudo apt install fail2ban -y

# Create local config
sudo nano /etc/fail2ban/jail.local

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🐳 Docker Security

### Docker Daemon Security

```bash
# Create Docker config
sudo mkdir -p /etc/docker
sudo nano /etc/docker/daemon.json

{
  "icc": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userns-remap": "default",
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp-profile.json"
}

sudo systemctl restart docker
```

### Docker Network Isolation

```bash
# Create internal network (no external access)
docker network create --driver bridge sowwy-internal --internal

# Run PostgreSQL on internal network only
docker run -d \
  --name sowwy-postgres \
  --network sowwy-internal \
  -e POSTGRES_PASSWORD=securepassword \
  -e POSTGRES_DB=sowwy \
  postgres:15-alpine

# Run Sowwy gateway with limited network
docker run -d \
  --name sowwy-gateway \
  --network sowwy-internal \
  -e SOWWY_POSTGRES_HOST=sowwy-postgres \
  -e MINIMAX_API_KEY=${MINIMAX_API_KEY} \
  -p 127.0.0.1:18789:18789 \
  clawdbot:latest
```

### Docker Secrets (For Swarm Mode)

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "${MINIMAX_API_KEY}" | docker secret create minimax_api_key -
echo "${SOWWY_POSTGRES_PASSWORD}" | docker secret create sowwy_postgres_password -

# Use secrets in service
docker service create \
  --name sowwy-gateway \
  --secret minimax_api_key \
  --secret sowwy_postgres_password \
  --replicas 1 \
  clawdbot:latest
```

---

## 🌐 Network Isolation

### Nginx Reverse Proxy (SSL Termination)

```bash
# Install nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/sowwy

server {
    listen 80;
    server_name sowwy.yourdomain.com;
    
    # SSL redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name sowwy.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/sowwy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sowwy.yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    location / {
        # Proxy to internal Sowwy gateway
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=one burst=20 nodelay;
    }
    
    # Rate limiting zone
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
}

# Enable site
sudo ln -s /etc/nginx/sites-available/sowwy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d sowwy.yourdomain.com
```

### Automatic SSL Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Monitoring & Alerting

### Log Management

```bash
# Install rsyslog
sudo apt install rsyslog -y

# Configure log forwarding
sudo nano /etc/rsyslog.conf
# Add: *.* @your-log-server:514

# Log rotation for Docker
sudo nano /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Security Monitoring Script

```bash
# Create monitoring script
cat << 'EOF' > ~/sowwy-security-monitor.sh
#!/bin/bash

LOG_FILE="/var/log/sowwy/security.log"
ALERT_EMAIL="your@email.com"

# Check failed SSH attempts
if last | grep "Failed password" > /dev/null; then
    echo "$(date) - Failed SSH attempts detected" >> $LOG_FILE
fi

# Check for unauthorized access
if grep "authentication failure" /var/log/auth.log > /dev/null; then
    echo "$(date) - Authentication failures detected" >> $LOG_FILE
fi

# Check Docker containers
for container in $(docker ps --format "{{.Names}}"); do
    if ! docker inspect -f '{{.State.Running}}' $container > /dev/null 2>&1; then
        echo "$(date) - Container $container is not running" >> $LOG_FILE
    fi
done

# Send alerts if issues found
if [ -s "$LOG_FILE" ]; then
    mail -s "Sowwy Security Alert" $ALERT_EMAIL < $LOG_FILE
fi
EOF

chmod +x ~/sowwy-security-monitor.sh

# Add to crontab
crontab -e
# Add: */5 * * * * ~/sowwy-security-monitor.sh
```

---

## 🔄 Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

# Enable auto-reboot
Unattended-Upgrade::AutoReBoot "true";

# Enable updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🛡️ Application-Level Security

### Kill Switch (Emergency Stop)

The `SOWWY_KILL_SWITCH` env var provides instant emergency stop:

```bash
# Set to true to disable all operations
SOWWY_KILL_SWITCH=true

# Or trigger via API
curl -X POST http://localhost:18789/sowwy/pause \
  -H "Authorization: Bearer ${SOWWY_TOKEN}"
```

### Approval Gates (Human-in-the-Loop)

Critical operations require approval:

| Operation | Default Action | Override |
|-----------|---------------|----------|
| `email.send` | Require approval | Only for whitelisted recipients |
| `browser.navigate` | Require approval | Always required |
| `financial.transaction` | Require approval | Never auto-approved |
| `persona.override` | Require approval | LegalOps can override |
| `hostinger.vps.create` | Require approval | ChiefOfStaff can approve |

### Rate Limiting

```bash
# SMT (Semantic Memory Throttling)
SOWWY_SMT_WINDOW_MS=18000000    # 5 hours
SOWWY_SMT_MAX_PROMPTS=100      # Max prompts per window
SOWWY_SMT_TARGET_UTILIZATION=0.80
```

---

## 📋 Quick Security Checklist

- [ ] `.env` file NOT in git
- [ ] SSH key authentication enabled
- [ ] SSH password authentication disabled
- [ ] Root login disabled
- [ ] Firewall configured (UFW/iptables)
- [ ] Fail2ban installed
- [ ] Docker running with `--internal` network
- [ ] SSL/TLS configured via Let's Encrypt
- [ ] Automatic security updates enabled
- [ ] Monitoring script set up
- [ ] Kill switch tested
- [ ] Approval gates configured
- [ ] Rate limiting enabled
- [ ] Logs forwarded to secure location
- [ ] Secrets rotated monthly

---

## 🚀 One-Click Secure Setup

```bash
#!/bin/bash
# Run this on your VPS for secure deployment

set -e

echo "🔒 Securing VPS for Sowwy..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ufw fail2ban nginx certbot python3-certbot-nginx docker.io

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure SSH (hardening done via cloud console)

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Create Docker network
docker network create --driver bridge sowwy-internal --internal

# Pull latest image
docker pull clawdbot:latest

echo "✅ VPS secured! Next steps:"
echo "1. Configure SSL: sudo certbot --nginx -d your-domain.com"
echo "2. Set up environment variables"
echo "3. Run: docker run -d --network sowwy-internal -p 127.0.0.1:18789:18789 clawdbot"
```

---

## 🎯 Zero-Maintenance Security

Once configured, Sowwy's security requires **zero micromanagement**:

1. **Automatic**: Firewall, fail2ban, updates
2. **Human-approves**: Financial, deployment, persona changes
3. **Audit trail**: All actions logged for review
4. **Kill switch**: Instant disable if issues arise

The system is designed so that even if MiniMax gets "ideas," it:
- Cannot access the internet directly (internal network only)
- Cannot exfiltrate data (all traffic goes through approved channels)
- Cannot escalate privileges (least privilege enforced)
- Cannot bypass approval gates (hardcoded in Gateway)

This is as close to "set and forget" as AI safety gets! 🔐
