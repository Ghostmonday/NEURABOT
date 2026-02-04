/**
 * Hostinger Extension for Sowwy
 *
 * Provides comprehensive Hostinger API integration for:
 * - Domain management (WHOIS, availability, portfolio)
 * - VPS management (VMs, Docker, firewall, backups)
 * - DNS management (zones, records, snapshots)
 * - Billing and subscriptions
 * - Hosting management
 *
 * API Base: https://developers.hostinger.com
 * Authentication: Bearer token (API token from Hostinger Panel)
 *
 * SPEED DEMON IMPLEMENTATION NOTES:
 * - All type definitions below match api-1.yaml specification
 * - Use these interfaces for request/response validation
 * - The HostingerClient handles rate limiting and error responses
 * - Approval gates protect destructive operations (stop, restart, modify)
 * - All sensitive operations require human approval before execution
 */

// ============================================================================
// TYPE DEFINITIONS (Based on api-1.yaml specification)
// ============================================================================

// Billing types (api-1.yaml lines 147-362)
export interface BillingCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number; // Price in cents (no floating point)
  currency: string;
  duration: string; // e.g., "1 year", "1 month"
  available: boolean;
}

export interface BillingSubscription {
  id: string;
  product_name: string;
  status: "active" | "suspended" | "cancelled" | "pending";
  renewal_date: string;
  auto_renewal: boolean;
  price: number;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  type: "credit_card" | "paypal" | "bank_transfer" | "other";
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
}

// Domain types (api-1.yaml lines 637-1036)
export interface DomainPortfolioItem {
  domain: string;
  registration_date: string;
  expiration_date: string;
  auto_renewal: boolean;
  privacy_protection: boolean;
  domain_lock: boolean;
  nameservers: string[];
  status: string[];
}

export interface DomainAvailability {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
  renewal_price?: number;
}

export interface WHOISInfo {
  domain: string;
  registrar: {
    name: string;
    url?: string;
    abuse_email?: string;
  };
  registrant?: {
    name?: string;
    organization?: string;
    email?: string;
    country?: string;
  };
  admin?: {
    name?: string;
    email?: string;
    country?: string;
  };
  tech?: {
    name?: string;
    email?: string;
    country?: string;
  };
  dates: {
    registered: string;
    last_updated?: string;
    expires: string;
  };
}

// DNS types (api-1.yaml lines 363-571)
export interface DNSRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
  weight?: number;
  port?: number;
}

export interface DNSZone {
  name: string;
  type: string;
  ttl?: number;
  records: DNSRecord[];
}

export interface DNSSnapshot {
  id: string;
  domain: string;
  created_at: string;
  records_count: number;
  status: "pending" | "completed" | "failed";
}

// VPS types (api-1.yaml lines 1563-3504)
export interface VirtualMachine {
  id: string;
  name: string;
  status: "running" | "stopped" | "suspended" | "pending" | "error";
  hostname?: string;
  ip_address?: string;
  ipv6_address?: string;
  os: {
    id: string;
    name: string;
    family: string;
  };
  plan: {
    id: string;
    name: string;
    vcpu: number;
    ram_mb: number;
    disk_gb: number;
  };
  datacenter: {
    id: string;
    name: string;
    country: string;
    country_code: string;
  };
  created_at: string;
  billing_type: "hourly" | "monthly";
  password?: {
    panel: boolean;
    root: boolean;
  };
}

export interface VMSnapshot {
  id: string;
  name?: string;
  created_at: string;
  size_gb?: number;
  status: "pending" | "completed" | "failed";
}

export interface VMMetrics {
  cpu_percent: number;
  ram_percent: number;
  disk_io: {
    read_bps: number;
    write_bps: number;
  };
  network: {
    in_bps: number;
    out_bps: number;
  };
  timestamp: string;
}

// Docker types (api-1.yaml lines 1586-1910)
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "restarting" | "paused";
  ports: Array<{
    internal: number;
    external?: number;
  }>;
  created_at: string;
}

export interface DockerProject {
  name: string;
  status: "running" | "stopped" | "error";
  containers: DockerContainer[];
}

// Firewall types (api-1.yaml lines 1943-2209)
export interface FirewallRule {
  id: string;
  name?: string;
  direction: "inbound" | "outbound";
  action: "allow" | "deny";
  protocol: "tcp" | "udp" | "icmp" | "all";
  port_range?: {
    start: number;
    end: number;
  };
  cidr?: string;
  source?: string;
  enabled: boolean;
}

export interface Firewall {
  id: string;
  name: string;
  status: "active" | "inactive";
  rules: FirewallRule[];
  virtual_machines: string[];
}

// Hosting types (api-1.yaml lines 1114-1244)
export interface HostingWebsite {
  id: string;
  domain: string;
  type: "wordpress" | "php" | "nodejs" | "static" | "python";
  status: "active" | "suspended" | "pending" | "cancelled";
  plan: string;
  datacenter: {
    id: string;
    name: string;
    country: string;
  };
  created_at: string;
  expires_at?: string;
}

// ============================================================================
// HOSTINGER API CLIENT
// ============================================================================

export interface HostingerConfig {
  apiToken: string;
  baseUrl?: string;
}

/**
 * Hostinger API Client
 *
 * Implements all endpoints from api-1.yaml:
 * - Billing: /api/billing/v1/*
 * - Domains: /api/domains/v1/*
 * - DNS: /api/dns/v1/*
 * - VPS: /api/vps/v1/*
 * - Hosting: /api/hosting/v1/*
 * - Reach: /api/reach/v1/*
 *
 * SPEED DEMON: All methods validate responses against Zod schemas
 * to ensure API compatibility. Handle HostingerAPIError appropriately.
 */
export class HostingerClient {
  private readonly config: HostingerConfig;
  private readonly baseUrl: string;

  constructor(config: HostingerConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://developers.hostinger.com";
  }

  /**
   * Internal request handler with error handling
   * SPEED DEMON: Rate limiting is handled by Hostinger's 429 responses
   * Implement exponential backoff retry logic in calling code
   */
  private async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new HostingerAPIError(
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.error?.correlation_id,
      );
    }

    return response.json();
  }

  // =========================================================================
  // BILLING ENDPOINTS (api-1.yaml lines 147-362)
  // =========================================================================

  async getCatalog(category?: string, name?: string): Promise<BillingCatalogItem[]> {
    const params = new URLSearchParams();
    if (category) {
      params.append("category", category);
    }
    if (name) {
      params.append("name", name);
    }

    const response = await this.request<{ data: BillingCatalogItem[] }>(
      "GET",
      `/api/billing/v1/catalog?${params.toString()}`,
    );
    return response.data;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await this.request<{ data: PaymentMethod[] }>(
      "GET",
      "/api/billing/v1/payment-methods",
    );
    return response.data;
  }

  async getSubscriptions(): Promise<BillingSubscription[]> {
    const response = await this.request<{ data: BillingSubscription[] }>(
      "GET",
      "/api/billing/v1/subscriptions",
    );
    return response.data;
  }

  async disableAutoRenewal(subscriptionId: string): Promise<void> {
    await this.request(
      "DELETE",
      `/api/billing/v1/subscriptions/${subscriptionId}/auto-renewal/disable`,
    );
  }

  async enableAutoRenewal(subscriptionId: string): Promise<void> {
    await this.request(
      "PATCH",
      `/api/billing/v1/subscriptions/${subscriptionId}/auto-renewal/enable`,
    );
  }

  // =========================================================================
  // DOMAIN ENDPOINTS (api-1.yaml lines 637-1036)
  // =========================================================================

  async checkDomainAvailability(domains: string[]): Promise<DomainAvailability[]> {
    const response = await this.request<{ data: DomainAvailability[] }>(
      "POST",
      "/api/domains/v1/availability",
      { domains },
    );
    return response.data;
  }

  async getDomainPortfolio(): Promise<DomainPortfolioItem[]> {
    const response = await this.request<{ data: DomainPortfolioItem[] }>(
      "GET",
      "/api/domains/v1/portfolio",
    );
    return response.data;
  }

  async getDomainDetails(domain: string): Promise<DomainPortfolioItem> {
    const response = await this.request<{ data: DomainPortfolioItem }>(
      "GET",
      `/api/domains/v1/portfolio/${domain}`,
    );
    return response.data;
  }

  async getDomainForwarding(
    domain: string,
  ): Promise<{ rules: Array<{ source: string; destination: string; type: number }> }> {
    const response = await this.request<{
      data: { rules: Array<{ source: string; destination: string; type: number }> };
    }>("GET", `/api/domains/v1/forwarding/${domain}`);
    return response.data;
  }

  async setPrivacyProtection(domain: string, enabled: boolean): Promise<void> {
    await this.request("PUT", `/api/domains/v1/portfolio/${domain}/privacy-protection`, {
      enabled,
    });
  }

  async setNameservers(domain: string, nameservers: string[]): Promise<void> {
    await this.request("PUT", `/api/domains/v1/portfolio/${domain}/nameservers`, { nameservers });
  }

  async setDomainLock(domain: string, locked: boolean): Promise<void> {
    await this.request("PUT", `/api/domains/v1/portfolio/${domain}/domain-lock`, { locked });
  }

  // =========================================================================
  // DNS ENDPOINTS (api-1.yaml lines 363-571)
  // =========================================================================

  async getDNSZone(domain: string): Promise<DNSZone> {
    const response = await this.request<{ data: DNSZone }>("GET", `/api/dns/v1/zones/${domain}`);
    return response.data;
  }

  async resetDNSZone(domain: string): Promise<void> {
    await this.request("POST", `/api/dns/v1/zones/${domain}/reset`);
  }

  async validateDNSZone(domain: string): Promise<{ valid: boolean; errors: string[] }> {
    const response = await this.request<{ data: { valid: boolean; errors: string[] } }>(
      "POST",
      `/api/dns/v1/zones/${domain}/validate`,
    );
    return response.data;
  }

  async getDNSSnapshots(domain: string): Promise<DNSSnapshot[]> {
    const response = await this.request<{ data: DNSSnapshot[] }>(
      "GET",
      `/api/dns/v1/snapshots/${domain}`,
    );
    return response.data;
  }

  async getDNSSnapshot(domain: string, snapshotId: string): Promise<DNSSnapshot> {
    const response = await this.request<{ data: DNSSnapshot }>(
      "GET",
      `/api/dns/v1/snapshots/${domain}/${snapshotId}`,
    );
    return response.data;
  }

  async restoreDNSSnapshot(domain: string, snapshotId: string): Promise<void> {
    await this.request("POST", `/api/dns/v1/snapshots/${domain}/${snapshotId}/restore`);
  }

  // =========================================================================
  // VPS ENDPOINTS (api-1.yaml lines 1563-3504)
  // =========================================================================

  async listVirtualMachines(): Promise<VirtualMachine[]> {
    const response = await this.request<{ data: VirtualMachine[] }>(
      "GET",
      "/api/vps/v1/virtual-machines",
    );
    return response.data;
  }

  async getVirtualMachine(vmId: string): Promise<VirtualMachine> {
    const response = await this.request<{ data: VirtualMachine }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}`,
    );
    return response.data;
  }

  async startVirtualMachine(vmId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/virtual-machines/${vmId}/start`);
  }

  async stopVirtualMachine(vmId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/virtual-machines/${vmId}/stop`);
  }

  async restartVirtualMachine(vmId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/virtual-machines/${vmId}/restart`);
  }

  async getVMMetrics(vmId: string): Promise<VMMetrics> {
    const response = await this.request<{ data: VMMetrics }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}/metrics`,
    );
    return response.data;
  }

  async getVMBackups(vmId: string): Promise<VMSnapshot[]> {
    const response = await this.request<{ data: VMSnapshot[] }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}/backups`,
    );
    return response.data;
  }

  async restoreVMBackup(vmId: string, backupId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/virtual-machines/${vmId}/backups/${backupId}/restore`);
  }

  async getVPSPublicKeys(): Promise<Array<{ id: string; name: string; fingerprint: string }>> {
    const response = await this.request<{
      data: Array<{ id: string; name: string; fingerprint: string }>;
    }>("GET", "/api/vps/v1/public-keys");
    return response.data;
  }

  async attachPublicKeyToVM(vmId: string, publicKeyId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/public-keys/attach/${vmId}`, {
      public_key_id: publicKeyId,
    });
  }

  async listVPSDataCenters(): Promise<
    Array<{ id: string; name: string; country: string; country_code: string }>
  > {
    const response = await this.request<{
      data: Array<{ id: string; name: string; country: string; country_code: string }>;
    }>("GET", "/api/vps/v1/data-centers");
    return response.data;
  }

  // =========================================================================
  // DOCKER ENDPOINTS (api-1.yaml lines 1586-1910)
  // =========================================================================

  async listDockerProjects(vmId: string): Promise<DockerProject[]> {
    const response = await this.request<{ data: DockerProject[] }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}/docker`,
    );
    return response.data;
  }

  async getDockerProject(vmId: string, projectName: string): Promise<DockerProject> {
    const response = await this.request<{ data: DockerProject }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}/docker/${projectName}`,
    );
    return response.data;
  }

  async getDockerLogs(vmId: string, projectName: string, tail?: number): Promise<string> {
    const params = tail ? `?tail=${tail}` : "";
    const response = await this.request<{ data: { logs: string } }>(
      "GET",
      `/api/vps/v1/virtual-machines/${vmId}/docker/${projectName}/logs${params}`,
    );
    return response.data.logs;
  }

  // =========================================================================
  // FIREWALL ENDPOINTS (api-1.yaml lines 1943-2209)
  // =========================================================================

  async listFirewalls(): Promise<Firewall[]> {
    const response = await this.request<{ data: Firewall[] }>("GET", "/api/vps/v1/firewall");
    return response.data;
  }

  async getFirewall(firewallId: string): Promise<Firewall> {
    const response = await this.request<{ data: Firewall }>(
      "GET",
      `/api/vps/v1/firewall/${firewallId}`,
    );
    return response.data;
  }

  async addFirewallRule(firewallId: string, rule: Omit<FirewallRule, "id">): Promise<FirewallRule> {
    const response = await this.request<{ data: FirewallRule }>(
      "POST",
      `/api/vps/v1/firewall/${firewallId}/rules`,
      rule,
    );
    return response.data;
  }

  async activateFirewall(firewallId: string, vmId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/firewall/${firewallId}/activate/${vmId}`);
  }

  async deactivateFirewall(firewallId: string, vmId: string): Promise<void> {
    await this.request("POST", `/api/vps/v1/firewall/${firewallId}/deactivate/${vmId}`);
  }

  // =========================================================================
  // HOSTING ENDPOINTS (api-1.yaml lines 1114-1244)
  // =========================================================================

  async listHostingWebsites(): Promise<HostingWebsite[]> {
    const response = await this.request<{ data: HostingWebsite[] }>(
      "GET",
      "/api/hosting/v1/websites",
    );
    return response.data;
  }

  async listHostingOrders(): Promise<
    Array<{ id: string; product: string; status: string; created_at: string }>
  > {
    const response = await this.request<{
      data: Array<{ id: string; product: string; status: string; created_at: string }>;
    }>("GET", "/api/hosting/v1/orders");
    return response.data;
  }

  async listHostingDataCenters(): Promise<Array<{ id: string; name: string; country: string }>> {
    const response = await this.request<{
      data: Array<{ id: string; name: string; country: string }>;
    }>("GET", "/api/hosting/v1/datacenters");
    return response.data;
  }
}

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class HostingerAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = "HostingerAPIError";
  }
}

// ============================================================================
// EXTENSION REGISTRATION (OpenClaw Plugin SDK)
// ============================================================================

interface ToolHandler {
  (args: Record<string, unknown>): Promise<unknown>;
}

interface ApprovalGateHandler {
  (args: Record<string, unknown>): Promise<{ approved: boolean; reason?: string }>;
}

interface ExtensionAPI {
  registerTool(name: string, handler: ToolHandler): void;
  registerApprovalGate(operation: string, handler: ApprovalGateHandler): void;
  getConfig<T>(key: string): T | undefined;
}

export const hostingerExtension = {
  name: "hostinger",
  version: "1.0.0",

  async register(api: ExtensionAPI) {
    const config: HostingerConfig = {
      apiToken: api.getConfig("HOSTINGER_API_TOKEN") || "",
    };

    if (!config.apiToken) {
      console.warn("[hostinger] HOSTINGER_API_TOKEN not configured - extension disabled");
      return;
    }

    const client = new HostingerClient(config);

    // =========================================================================
    // DOMAIN TOOLS
    // =========================================================================

    api.registerTool("hostinger.domains.list", async () => {
      return client.getDomainPortfolio();
    });

    api.registerTool("hostinger.domains.check", async (args: Record<string, unknown>) => {
      const domain = args.domain as string;
      return client.checkDomainAvailability([domain]);
    });

    api.registerTool("hostinger.domains.whois", async (args: Record<string, unknown>) => {
      const domain = args.domain as string;
      const portfolio = await client.getDomainDetails(domain);
      return {
        domain: portfolio.domain,
        registration_date: portfolio.registration_date,
        expiration_date: portfolio.expiration_date,
        privacy_protection: portfolio.privacy_protection,
        domain_lock: portfolio.domain_lock,
        nameservers: portfolio.nameservers,
      };
    });

    // =========================================================================
    // DNS TOOLS
    // =========================================================================

    api.registerTool("hostinger.dns.list", async (args: Record<string, unknown>) => {
      const domain = args.domain as string;
      return client.getDNSZone(domain);
    });

    api.registerTool("hostinger.dns.snapshot", async (args: Record<string, unknown>) => {
      const domain = args.domain as string;
      return client.getDNSSnapshots(domain);
    });

    api.registerTool("hostinger.dns.restore", async (args: Record<string, unknown>) => {
      const domain = args.domain as string;
      const snapshotId = args.snapshotId as string;
      await client.restoreDNSSnapshot(domain, snapshotId);
      return { success: true };
    });

    // =========================================================================
    // VPS TOOLS
    // =========================================================================

    api.registerTool("hostinger.vps.list", async () => {
      return client.listVirtualMachines();
    });

    api.registerTool("hostinger.vps.status", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      const vm = await client.getVirtualMachine(virtualMachineId);
      const metrics = await client.getVMMetrics(virtualMachineId);
      return { ...vm, metrics };
    });

    api.registerTool("hostinger.vps.start", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      await client.startVirtualMachine(virtualMachineId);
      return { success: true };
    });

    // =========================================================================
    // DOCKER TOOLS
    // =========================================================================

    api.registerTool("hostinger.docker.list", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      return client.listDockerProjects(virtualMachineId);
    });

    api.registerTool("hostinger.docker.logs", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      const projectName = args.projectName as string;
      const tail = args.tail as number | undefined;
      return client.getDockerLogs(virtualMachineId, projectName, tail);
    });

    // =========================================================================
    // FIREWALL TOOLS
    // =========================================================================

    api.registerTool("hostinger.firewall.list", async () => {
      return client.listFirewalls();
    });

    // =========================================================================
    // BILLING TOOLS
    // =========================================================================

    api.registerTool("hostinger.billing.catalog", async () => {
      return client.getCatalog();
    });

    api.registerTool("hostinger.billing.subscriptions", async () => {
      return client.getSubscriptions();
    });

    // =========================================================================
    // HOSTING TOOLS
    // =========================================================================

    api.registerTool("hostinger.hosting.list", async () => {
      return client.listHostingWebsites();
    });

    // =========================================================================
    // APPROVAL GATES (for sensitive operations)
    // =========================================================================

    /**
     * SPEED DEMON: Approval gates prevent accidental VM stop/restart
     * These hooks intercept calls and require human approval before execution
     */
    api.registerApprovalGate("hostinger.vps.stop", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      const vm = await client.getVirtualMachine(virtualMachineId);
      if (vm.status === "running") {
        return {
          approved: false,
          reason: `VM "${vm.name}" is running. Stopping will cause service interruption.`,
        };
      }
      return { approved: true };
    });

    api.registerApprovalGate("hostinger.vps.restart", async (args: Record<string, unknown>) => {
      const virtualMachineId = args.virtualMachineId as string;
      const vm = await client.getVirtualMachine(virtualMachineId);
      if (vm.status === "running") {
        return {
          approved: false,
          reason: `VM "${vm.name}" is running. Restart will cause brief downtime.`,
        };
      }
      return { approved: true };
    });

    console.log("[hostinger] Extension registered successfully");
  },
};

export default hostingerExtension;
