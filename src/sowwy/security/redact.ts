/**
 * Sowwy Security - Secret Redaction
 *
 * Prevents API keys, tokens, and credentials from appearing in logs, errors, or debug output.
 *
 * ⚠️ CRITICAL: This must be applied to ALL logging, error messages, and debug output.
 *
 * Patterns:
 * - MiniMax API keys: sk-cp-*
 * - Hostinger tokens: various formats
 * - PostgreSQL passwords: in connection strings
 * - Generic API keys: apiKey, token, password fields
 */

// ============================================================================
// Secret Patterns (regex)
// ============================================================================

const SECRET_PATTERNS = [
  // MiniMax API keys
  /sk-cp-[A-Za-z0-9_-]{40,}/g,

  // Generic API keys (sk-, pk-, etc.)
  /\b(sk|pk|ak|tk)-[A-Za-z0-9_-]{20,}/gi,

  // Hostinger tokens (various formats)
  /\bhostinger[_-]?token[=:]\s*[A-Za-z0-9_-]{20,}/gi,

  // PostgreSQL connection strings
  /postgres:\/\/[^:]+:[^@]+@/gi,
  /password[=:]\s*['"]?[^'"\s]{8,}['"]?/gi,

  // Environment variable patterns
  /MINIMAX_API_KEY[=:]\s*[^\s]+/gi,
  /HOSTINGER_API_TOKEN[=:]\s*[^\s]+/gi,
  /POSTGRES_PASSWORD[=:]\s*[^\s]+/gi,
  /API_KEY[=:]\s*[^\s]+/gi,
  /SECRET[=:]\s*[^\s]+/gi,

  // JSON fields
  /"apiKey"\s*:\s*"[^"]{10,}"/gi,
  /"token"\s*:\s*"[^"]{10,}"/gi,
  /"password"\s*:\s*"[^"]{8,}"/gi,
  /"secret"\s*:\s*"[^"]{8,}"/gi,
  /"authToken"\s*:\s*"[^"]{10,}"/gi,

  // Bearer tokens
  /Bearer\s+[A-Za-z0-9_-]{20,}/gi,

  // SSH keys (partial)
  /-----BEGIN\s+(?:RSA|EC|OPENSSH)\s+PRIVATE\s+KEY-----[\s\S]{50,}-----END/gi,
];

// ============================================================================
// Redaction Functions
// ============================================================================

/**
 * Redact secrets from a string
 */
export function redactString(text: string): string {
  if (!text || typeof text !== "string") {
    return text;
  }

  let redacted = text;

  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      // Keep first 4 chars and last 4 chars for debugging, redact middle
      if (match.length > 12) {
        const prefix = match.substring(0, 4);
        const suffix = match.substring(match.length - 4);
        return `${prefix}...[REDACTED]...${suffix}`;
      }
      return "[REDACTED]";
    });
  }

  return redacted;
}

/**
 * Redact secrets from an object (recursive)
 */
export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return redactString(obj);
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }

  const redacted: Record<string, unknown> = {};
  const sensitiveKeys = [
    "apiKey",
    "api_key",
    "token",
    "password",
    "secret",
    "authToken",
    "auth_token",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
    "privateKey",
    "private_key",
    "minimax_api_key",
    "hostinger_api_token",
    "postgres_password",
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // If key suggests sensitive data, redact regardless of value
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      if (typeof value === "string" && value.length > 8) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactObject(value);
      }
    } else {
      redacted[key] = redactObject(value);
    }
  }

  return redacted;
}

/**
 * Redact secrets from error objects
 */
export function redactError(error: unknown): unknown {
  if (error instanceof Error) {
    const redacted = new Error(redactString(error.message));
    redacted.name = error.name;
    redacted.stack = error.stack ? redactString(error.stack) : undefined;
    if (error.cause) {
      (redacted as Error & { cause?: unknown }).cause = redactError(error.cause);
    }
    return redacted;
  }

  if (typeof error === "string") {
    return redactString(error);
  }

  return redactObject(error);
}

/**
 * Safe stringify with redaction
 */
export function safeStringify(obj: unknown, space?: number): string {
  try {
    const redacted = redactObject(obj);
    return JSON.stringify(redacted, null, space);
  } catch {
    return "[REDACTED: stringify failed]";
  }
}

/**
 * Create a redacted logger wrapper
 */
export function createRedactedLogger(baseLogger: {
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
}) {
  return {
    info: (msg: string, ...args: unknown[]) => {
      baseLogger.info(redactString(msg), ...args.map(redactObject));
    },
    error: (msg: string, ...args: unknown[]) => {
      baseLogger.error(redactString(msg), ...args.map(redactError));
    },
    warn: (msg: string, ...args: unknown[]) => {
      baseLogger.warn(redactString(msg), ...args.map(redactObject));
    },
    debug: (msg: string, ...args: unknown[]) => {
      baseLogger.debug(redactString(msg), ...args.map(redactObject));
    },
  };
}
