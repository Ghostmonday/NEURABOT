/**
 * Gateway Security Middleware
 *
 * Implements security headers and CORS protection for all HTTP responses.
 *
 * ⚠️ CRITICAL: These headers must be applied to ALL HTTP responses to prevent
 * common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.)
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Security headers configuration
 */
export type SecurityHeadersConfig = {
  /** Enable HSTS header (only when TLS is enabled) */
  hsts?: boolean;
  /** Content Security Policy string */
  contentSecurityPolicy?: string;
};

/**
 * CORS configuration
 */
export type CorsConfig = {
  /** Allowed origins (use "*" for all origins, not recommended for production) */
  allowedOrigins: string[];
  /** Allow credentials in CORS requests */
  allowCredentials?: boolean;
};

/**
 * Apply security headers to HTTP response
 *
 * These headers protect against:
 * - XSS attacks (X-XSS-Protection, CSP)
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Referrer leakage (Referrer-Policy)
 * - Protocol downgrade (HSTS)
 */
export function applySecurityHeaders(res: ServerResponse, config?: SecurityHeadersConfig): void {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking attacks
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy - only send referrer for same-origin requests
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy
  const csp = config?.contentSecurityPolicy ?? "default-src 'self'";
  res.setHeader("Content-Security-Policy", csp);

  // HSTS - only when TLS is enabled
  if (config?.hsts) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

/**
 * Apply CORS headers to HTTP response
 *
 * Returns false if request should be rejected (origin not allowed or preflight handled),
 * true if request should continue processing.
 */
export function applyCorsHeaders(
  req: IncomingMessage,
  res: ServerResponse,
  config: CorsConfig,
): boolean {
  const origin = req.headers.origin;

  // No origin header = same-origin request, allow it
  if (!origin) {
    return true;
  }

  // Check if origin is allowed
  const isAllowed = config.allowedOrigins.includes(origin) || config.allowedOrigins.includes("*");

  if (!isAllowed) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Forbidden: Origin not allowed");
    return false;
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-OpenClaw-Token");

  if (config.allowCredentials) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return false;
  }

  return true;
}
