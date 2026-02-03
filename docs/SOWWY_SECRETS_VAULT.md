# Sowwy Secrets Vault Setup

**Use a mini PC as a dedicated secrets vault** - keys never stored on production VPS.

## Architecture

```
┌──────────────────┐          ┌─────────────────┐
│   Mini PC        │          │  Production VPS │
│  (Home/Office)   │◄────────►│  (Hostinger)    │
│                  │ Tailscale│                 │
│ • MiniMax key    │   Only   │ • Gateway       │
│ • Hostinger key  │          │ • Postgres      │
│ • SSH keys       │          │ • No secrets    │
│ • Backup keys    │          │                 │
└──────────────────┘          └─────────────────┘
```

## Mini PC Setup

### 1. Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Note your Tailscale IP (100.x.x.x)
```

### 2. Create Secrets Vault Server

```bash
mkdir -p /home/vault
cd /home/vault

# Install Python dependencies
pip3 install flask flask-cors

# Create vault server
cat > secrets-vault.py << 'EOF'
#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv('/home/vault/.env')

app = Flask(__name__)
CORS(app)  # Only allow Tailscale IPs in production

SECRETS = {
    "minimax": os.environ.get("MINIMAX_API_KEY", ""),
    "hostinger": os.environ.get("HOSTINGER_API_TOKEN", ""),
}

@app.route('/secret/<key>', methods=['GET'])
def get_secret(key):
    if key in SECRETS and SECRETS[key]:
        return SECRETS[key], 200
    return "Secret not found", 404

@app.route('/health', methods=['GET'])
def health():
    return {"status": "ok", "secrets_available": list(SECRETS.keys())}, 200

if __name__ == '__main__':
    # Only bind to Tailscale interface (replace with your IP)
    TAILSCALE_IP = os.environ.get("TAILSCALE_IP", "100.x.x.x")
    app.run(host=TAILSCALE_IP, port=8080, debug=False)
EOF

chmod +x secrets-vault.py
```

### 3. Store Secrets

```bash
# Create .env file
cat > /home/vault/.env << 'EOF'
MINIMAX_API_KEY=sk-cp-your-key-here
HOSTINGER_API_TOKEN=your-token-here
TAILSCALE_IP=100.x.x.x  # Your mini PC Tailscale IP
EOF

chmod 600 /home/vault/.env
chmod 700 /home/vault
```

### 4. Systemd Service

```bash
cat > ~/.config/systemd/user/secrets-vault.service << 'EOF'
[Unit]
Description=Secrets Vault Server
After=tailscaled.service network.target

[Service]
Type=simple
WorkingDirectory=/home/vault
EnvironmentFile=/home/vault/.env
ExecStart=/usr/bin/python3 /home/vault/secrets-vault.py
Restart=always
RestartSec=10

# Security hardening
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/vault
NoNewPrivileges=true
PrivateTmp=true
ProtectKernelTunables=true

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now secrets-vault.service
```

### 5. Test Vault

```bash
# From mini PC
curl http://localhost:8080/health

# From VPS (via Tailscale)
curl http://mini-pc.tailnet:8080/secret/minimax
```

## Production VPS Setup

### Fetch Keys at Startup

```bash
# Create key fetcher script
cat > /opt/openclaw/fetch-secrets.sh << 'EOF'
#!/bin/bash
VAULT_URL="http://mini-pc.tailnet:8080"

export MINIMAX_API_KEY=$(curl -sf "${VAULT_URL}/secret/minimax")
export HOSTINGER_API_TOKEN=$(curl -sf "${VAULT_URL}/secret/hostinger")

if [ -z "$MINIMAX_API_KEY" ]; then
  echo "ERROR: Failed to fetch MiniMax key from vault" >&2
  exit 1
fi

# Keys are now in environment, never written to disk
exec "$@"
EOF

chmod +x /opt/openclaw/fetch-secrets.sh
```

### Update Gateway Service

```ini
# ~/.config/systemd/user/openclaw-gateway.service.d/vault.conf
[Service]
# Fetch secrets before starting
ExecStartPre=/opt/openclaw/fetch-secrets.sh /bin/true
ExecStart=/opt/openclaw/fetch-secrets.sh /usr/bin/node /opt/openclaw/openclaw.mjs gateway

# Keys live in RAM only
Environment=
EnvironmentFile=
```

## Security Checklist

- [ ] Mini PC disk encrypted (LUKS)
- [ ] Tailscale MFA enabled
- [ ] Vault only binds to Tailscale IP (100.x.x.x)
- [ ] Vault firewall: only allow Tailscale subnet
- [ ] VPS never writes keys to disk
- [ ] Backup vault .env encrypted (GPG)
- [ ] Monitor vault access logs

## Fallback: Direct Env (If Vault Unavailable)

If vault is down, you can temporarily use direct env:

```bash
# Emergency fallback (not recommended)
export MINIMAX_API_KEY=sk-cp-...
export HOSTINGER_API_TOKEN=...
```

But prefer vault for production.

## See Also

- [SOWWY_SYSTEMD_HARDENING.md](SOWWY_SYSTEMD_HARDENING.md) - Process isolation
- [SOWWY_VPS_SECURITY.md](SOWWY_VPS_SECURITY.md) - Network hardening
