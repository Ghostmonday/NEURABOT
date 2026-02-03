# Sowwy Systemd Hardening

Systemd service hardening for permanent API keys. Prevents credential leakage even if the gateway process is compromised.

## Gateway Service Hardening

Create override directory:

```bash
mkdir -p ~/.config/systemd/user/openclaw-gateway.service.d
```

Create hardening config:

```ini
# ~/.config/systemd/user/openclaw-gateway.service.d/hardening.conf
[Service]
# Filesystem protection
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=%h/.openclaw

# Process isolation
NoNewPrivileges=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictNamespaces=true
LockPersonality=true
RestrictRealtime=true

# Network (if using Tailscale)
# Bind to Tailscale interface only (100.x.x.x)
# Set in gateway command: --bind tailnet

# Memory protection
MemoryDenyWriteExecute=true
RestrictSUIDSGID=true

# Capabilities
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=
```

Reload and restart:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

## Secrets Vault Service (Mini PC)

If using mini PC as secrets vault:

```ini
# ~/.config/systemd/user/secrets-vault.service.d/hardening.conf
[Service]
# Only bind to Tailscale interface
# Set in Python: HTTPServer(("100.x.x.x", 8080), ...)

ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/vault
NoNewPrivileges=true
PrivateTmp=true

# Network isolation
RestrictAddressFamilies=AF_INET AF_INET6
```

## Verification

Check service security:

```bash
systemctl --user show openclaw-gateway.service | grep -i protect
```

Should show:
```
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
```

## Credential File Permissions

```bash
# Credentials directory
chmod 700 ~/.openclaw/credentials

# Individual key files
chmod 600 ~/.openclaw/credentials/*.key
chmod 600 ~/.openclaw/.env

# Verify
ls -la ~/.openclaw/credentials/
```

## Backup Encryption

Never backup unencrypted credentials:

```bash
# Encrypted backup script
#!/bin/bash
BACKUP_FILE="openclaw-backup-$(date +%Y%m%d).tar.gz.gpg"
tar czf - ~/.openclaw | \
  gpg --encrypt --recipient your@email.com \
  --output "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
```

## Secrets Vault Setup (Optional)

If using mini PC as vault:

```bash
# On mini PC
mkdir -p /home/vault
chmod 700 /home/vault

# Store secrets
cat > /home/vault/.env << 'EOF'
MINIMAX_API_KEY=sk-cp-your-key
HOSTINGER_API_TOKEN=your-token
EOF
chmod 600 /home/vault/.env

# Install secrets server
# (See SOWWY_VPS_SECURITY.md for Python script)

# Systemd service
systemctl --user enable --now secrets-vault.service
```

## Testing

Verify secrets are redacted:

```bash
# Trigger an error that might log secrets
openclaw gateway --invalid-flag 2>&1 | grep -i "redacted\|sk-cp"

# Should see [REDACTED] not actual keys
```

## See Also

- [SOWWY_VPS_SECURITY.md](SOWWY_VPS_SECURITY.md) - Network hardening
- [SOWWY_ARCHITECTURE.md](SOWWY_ARCHITECTURE.md) - Security model
