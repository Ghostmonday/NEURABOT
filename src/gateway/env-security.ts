/**
 * Environment Security Validation
 *
 * Validates security-critical environment variables at startup
 * to catch misconfigurations before they become vulnerabilities.
 */

/**
 * Security validation warnings (non-fatal)
 */
export type SecurityWarnings = {
  warnings: string[];
  errors: string[];
};

/**
 * Validate security-critical environment variables
 *
 * Checks for:
 * - Weak tokens (too short)
 * - Password mode usage (less secure than token)
 * - Missing TLS in production
 * - Exposed secrets in environment
 *
 * @returns Warnings and errors found
 */
export function validateSecurityEnv(): SecurityWarnings {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check gateway token strength
  const token = process.env.OPENCLAW_GATEWAY_TOKEN ?? process.env.CLAWDBOT_GATEWAY_TOKEN;
  if (token && token.length < 32) {
    warnings.push(
      `OPENCLAW_GATEWAY_TOKEN is too short (${token.length} chars, minimum 32 recommended)`,
    );
  }

  // Check for password mode (less secure)
  const password = process.env.OPENCLAW_GATEWAY_PASSWORD ?? process.env.CLAWDBOT_GATEWAY_PASSWORD;
  if (password) {
    warnings.push(
      "Password authentication mode is less secure than token mode. Consider migrating to token-based auth.",
    );
  }

  // Check TLS configuration
  const tlsEnabled = process.env.OPENCLAW_TLS_ENABLED === "true";
  const loopbackOnly = process.env.LOOPBACK_ONLY === "true";
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (!tlsEnabled && !loopbackOnly && nodeEnv === "production") {
    errors.push(
      "TLS should be enabled for production deployments. Set OPENCLAW_TLS_ENABLED=true or use LOOPBACK_ONLY=true for local development only.",
    );
  }

  // Check for common secret exposure patterns
  const envKeys = Object.keys(process.env);
  const suspiciousPatterns = [/password/i, /secret/i, /key/i, /token/i, /credential/i];

  for (const key of envKeys) {
    const value = process.env[key];
    if (!value || value.length < 8) {
      continue;
    }

    // Check if key suggests sensitive data but value looks exposed
    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(key));
    if (isSuspicious && value.includes(" ") && value.length > 50) {
      warnings.push(
        `Environment variable ${key} may contain sensitive data. Ensure it's not logged or exposed.`,
      );
    }
  }

  return { warnings, errors };
}

/**
 * Validate and log security warnings/errors
 *
 * @throws Error if critical security issues found
 */
export function validateAndLogSecurityEnv(): void {
  const { warnings, errors } = validateSecurityEnv();

  if (warnings.length > 0) {
    console.warn("Security warnings:");
    for (const warning of warnings) {
      console.warn(`  ⚠️  ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error("Security configuration errors:");
    for (const error of errors) {
      console.error(`  ❌ ${error}`);
    }
    throw new Error(`Security validation failed. Fix the errors above before starting the server.`);
  }
}
