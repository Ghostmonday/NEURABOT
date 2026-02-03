/**
 * Gateway Rate Limiter
 * 
 * IP-based rate limiting to prevent DoS attacks and API abuse.
 * 
 * Features:
 * - Sliding window rate limiting
 * - Automatic IP blocking after threshold exceeded
 * - Periodic cleanup of expired entries
 */

export type RateLimiterConfig = {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests per window (default: 100) */
  maxRequests?: number;
  /** Block duration in milliseconds after exceeding limit (default: 300000 = 5 minutes) */
  blockDurationMs?: number;
  /** IP addresses to whitelist (bypass rate limiting) */
  whitelist?: string[];
};

type RequestEntry = {
  count: number;
  resetAt: number;
};

/**
 * Gateway Rate Limiter
 * 
 * Tracks requests per IP address and blocks excessive requests.
 */
export class GatewayRateLimiter {
  private requests = new Map<string, RequestEntry>();
  private blocked = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private config: RateLimiterConfig = {}) {
    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Check if request from client IP should be allowed
   * 
   * @returns Object with allowed status and optional retryAfter seconds
   */
  check(clientIp: string): { allowed: boolean; retryAfter?: number } {
    // Check whitelist
    if (this.config.whitelist?.includes(clientIp)) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowMs = this.config.windowMs ?? 60000;
    const maxRequests = this.config.maxRequests ?? 100;
    const blockDurationMs = this.config.blockDurationMs ?? 300000;

    // Check if IP is currently blocked
    const blockedUntil = this.blocked.get(clientIp);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((blockedUntil - now) / 1000),
      };
    }

    // Get or create request entry
    let entry = this.requests.get(clientIp);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.requests.set(clientIp, entry);
    }

    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      // Block the IP
      this.blocked.set(clientIp, now + blockDurationMs);
      return {
        allowed: false,
        retryAfter: Math.ceil(blockDurationMs / 1000),
      };
    }

    return { allowed: true };
  }

  /**
   * Manually block an IP address
   */
  block(clientIp: string, durationMs: number): void {
    this.blocked.set(clientIp, Date.now() + durationMs);
  }

  /**
   * Manually unblock an IP address
   */
  unblock(clientIp: string): void {
    this.blocked.delete(clientIp);
    this.requests.delete(clientIp);
  }

  /**
   * Get current request count for an IP
   */
  getRequestCount(clientIp: string): number {
    const entry = this.requests.get(clientIp);
    if (!entry) return 0;
    const now = Date.now();
    if (now >= entry.resetAt) return 0;
    return entry.count;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.requests) {
      if (now >= entry.resetAt) {
        this.requests.delete(ip);
      }
    }
    for (const [ip, until] of this.blocked) {
      if (now >= until) {
        this.blocked.delete(ip);
      }
    }
  }

  /**
   * Stop cleanup interval (call on shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
    this.blocked.clear();
  }
}
