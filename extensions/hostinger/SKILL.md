---
name: extension-hostinger
description: Hostinger extension for Sowwy - Domains, VPS, Billing, DNS management
metadata:
  type: extension
  category: INFRASTRUCTURE
  requires_api:
    - hostinger-api
---

# Hostinger Extension

Comprehensive Hostinger API integration for Sowwy - manages domains, VPS, billing, DNS, and hosting resources.

## Features

### Domain Management

- **WHOIS Lookup**: Query domain registration information
- **Availability Check**: Check if domains are available for registration
- **Portfolio Management**: List and manage owned domains
- **DNS Management**: Full zone management with snapshots and restore
- **Domain Forwarding**: Configure URL forwarding rules
- **Privacy Protection**: Enable/disable WHOIS privacy
- **Nameserver Management**: Update domain nameservers
- **Domain Locking**: Enable/disable transfer locks

### VPS Management

- **Virtual Machines**: List, create, manage VPS instances
- **Docker Management**: Container orchestration via VPS Docker
- **Firewall Management**: Configure firewall rules
- **Backups & Snapshots**: Create and restore VM snapshots
- **Metrics Monitoring**: Get VM performance metrics
- **Public Key Management**: SSH key management
- **Recovery Mode**: Boot VPS into recovery mode
- **Password Management**: Reset panel and root passwords

### Hosting Management

- **Website Management**: List and manage hosting accounts
- **Orders**: Track hosting orders
- **Datacenter Selection**: Choose optimal datacenter location
- **Free Subdomains**: Provision free subdomains
- **Ownership Verification**: Verify domain ownership

### Billing & Subscriptions

- **Catalog**: View available services and pricing
- **Payment Methods**: Manage payment options
- **Subscriptions**: Track and manage recurring services
- **Auto-Renewal**: Enable/disable automatic renewals

### DNS & Reach

- **Zone Management**: Full DNS zone control
- **DNS Snapshots**: Backup and restore DNS configurations
- **Contacts Management**: Manage contact information
- **Segments**: Organize contacts into segments

## Configuration

```bash
# Hostinger API Configuration
HOSTINGER_API_TOKEN=your_api_token_here
HOSTINGER_API_BASE_URL=https://developers.hostinger.com
```

### Creating API Token

1. Log in to Hostinger Panel (hpanel.hostinger.com)
2. Go to Account > Profile > API
3. Create a new API token with required permissions
4. Copy the token to your `.env` file

## Commands

### Domain Commands

- `hostinger.domains.list` - List all owned domains
- `hostinger.domains.check` - Check domain availability
- `hostinger.domains.whois` - Get WHOIS information
- `hostinger.domains.purchase` - Purchase available domain (requires approval)

### DNS Commands

- `hostinger.dns.list` - List DNS zones
- `hostinger.dns.records` - Get DNS records for domain
- `hostinger.dns.add` - Add DNS record
- `hostinger.dns.update` - Update DNS record
- `hostinger.dns.delete` - Delete DNS record
- `hostinger.dns.snapshot` - Create DNS snapshot
- `hostinger.dns.restore` - Restore DNS from snapshot

### VPS Commands

- `hostinger.vps.list` - List all virtual machines
- `hostinger.vps.create` - Create new VPS (requires approval)
- `hostinger.vps.start` - Start virtual machine
- `hostinger.vps.stop` - Stop virtual machine
- `hostinger.vps.restart` - Restart virtual machine
- `hostinger.vps.status` - Get VM status and metrics
- `hostinger.vps.backup` - Create VM backup
- `hostinger.vps.restore` - Restore VM from backup

### Docker Commands

- `hostinger.docker.list` - List Docker projects
- `hostinger.docker.containers` - List containers in project
- `hostinger.docker.start` - Start container
- `hostinger.docker.stop` - Stop container
- `hostinger.docker.restart` - Restart container
- `hostinger.docker.logs` - Get container logs

### Firewall Commands

- `hostinger.firewall.list` - List firewall rules
- `hostinger.firewall.add` - Add firewall rule
- `hostinger.firewall.remove` - Remove firewall rule

### Billing Commands

- `hostinger.billing.catalog` - Get service catalog with pricing
- `hostinger.billing.methods` - List payment methods
- `hostinger.billing.subscriptions` - List active subscriptions
- `hostinger.billing.renewal.disable` - Disable auto-renewal
- `hostinger.billing.renewal.enable` - Enable auto-renewal

### Hosting Commands

- `hostinger.hosting.list` - List hosting accounts
- `hostinger.hosting.websites` - List websites

## Approval Gates

### Requires Immediate Approval (Human Required)

- `hostinger.domains.purchase` - Domain purchases involve financial transactions
- `hostinger.vps.create` - New VPS provisioning costs money
- `hostinger.billing.renewal.disable` - Disabling renewals risks service loss

### Requires ChiefOfStaff Review

- `hostinger.vps.stop` - Stopping production VMs
- `hostinger.vps.restart` - Restarting production systems

### Requires LegalOps Review

- `hostinger.domains.transfer` - Domain transfers involve legal ownership changes
- Any bulk operations affecting multiple domains

### Low Risk (Auto-Approved)

- `hostinger.domains.list` - Read-only listing
- `hostinger.domains.whois` - WHOIS lookup is informational
- `hostinger.dns.list` - DNS zone listing
- `hostinger.vps.status` - Status checks only
- `hostinger.billing.catalog` - Viewing pricing

## Identity Integration

This extension can contribute to Sowwy's identity model:

### Captures Domain Ownership Identity

- **Domain Portfolio**: Shows technical/web presence preferences
- **VPS Configuration**: Indicates infrastructure maturity level
- **Billing Patterns**: Reveals budget priorities and spending habits

### DNS Management Patterns

- Records managed show technical sophistication
- Snapshot habits indicate caution/risk tolerance

### Usage Examples

```typescript
// Check domain availability
const availability = await sowwy.execute({
  command: "hostinger.domains.check",
  args: { domain: "example.com" },
});

// List all VPS instances
const vpsList = await sowwy.execute({
  command: "hostinger.vps.list",
});

// Get VM metrics
const metrics = await sowwy.execute({
  command: "hostinger.vps.status",
  args: { virtualMachineId: "vm-12345" },
});

// Create DNS snapshot before changes
const snapshot = await sowwy.execute({
  command: "hostinger.dns.snapshot",
  args: { domain: "example.com" },
});
```

## Rate Limiting

Hostinger API enforces rate limits. This extension implements:

- Request queuing to respect rate limits
- Automatic retry with exponential backoff
- Rate limit headers monitoring

## Error Handling

Common errors and handling:

- **401 Unauthorized**: Invalid/expired API token - prompt for re-authentication
- **429 Too Many Requests**: Rate limit exceeded - wait and retry
- **403 Forbidden**: Insufficient permissions - check API token scopes

## Security Notes

- Store API tokens securely in `.env` - never commit to version control
- API tokens inherit user's permissions - use limited-scope tokens for automation
- All destructive operations require approval gates
- DNS and domain changes can cause service disruptions - review before approving

## API Base URL

Production: `https://developers.hostinger.com`

All endpoints use this base URL with versioned paths (e.g., `/api/domains/v1/portfolio`)
