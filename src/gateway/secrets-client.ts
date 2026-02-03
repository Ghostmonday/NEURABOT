/**
 * Secrets Client
 * 
 * Client for fetching secrets from home security server (HashiCorp Vault).
 * 
 * This allows the VPS to never store raw API keys - all secrets are
 * fetched on-demand from the secure home server over Tailscale VPN.
 */

/**
 * Secrets client configuration
 */
export type SecretsClientConfig = {
  /** Vault URL (e.g., "http://100.x.x.x:8200" via Tailscale) */
  vaultUrl: string;
  /** Vault authentication token */
  authToken: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
};

/**
 * Secrets Client
 * 
 * Fetches secrets from HashiCorp Vault running on home security server.
 */
export class SecretsClient {
  private timeoutMs: number;

  constructor(private config: SecretsClientConfig) {
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  /**
   * Get secret value from Vault
   * 
   * @param path - Secret path (e.g., "secret/data/minimax/api_key")
   * @returns Secret value
   * @throws Error if secret not found or request fails
   */
  async getSecret(path: string): Promise<string> {
    const url = `${this.config.vaultUrl}/v1/${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: {
          "X-Vault-Token": this.config.authToken,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Vault request failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      // Vault KV v2 format: data.data.value
      return data.data?.data?.value ?? data.data?.value ?? String(data);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Vault request timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Proxy API call through home server
   * 
   * This allows API calls to external services without the VPS ever
   * seeing the raw API keys. The home server proxies the request.
   * 
   * @param service - Service name (e.g., "minimax")
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @returns API response
   */
  async proxyApiCall(
    service: string,
    endpoint: string,
    body: unknown,
  ): Promise<unknown> {
    const url = `${this.config.vaultUrl}/proxy/${service}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs * 2);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-Vault-Token": this.config.authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Proxy request failed: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Proxy request timeout after ${this.timeoutMs * 2}ms`);
      }
      throw err;
    }
  }

  /**
   * Test connection to Vault
   * 
   * @returns True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getSecret("secret/data/test");
      return true;
    } catch {
      // Try health endpoint instead
      try {
        const url = `${this.config.vaultUrl}/v1/sys/health`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        return res.ok;
      } catch {
        return false;
      }
    }
  }
}
