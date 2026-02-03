/**
 * Sowwy Security Model - Zero Trust Foundation
 * 
 * Principles:
 * - Default-deny, least privilege, explicit approvals
 * - Gateway is the only ingress; all other services are internal-only
 * - All external sends require approval
 * - Identities are immutable except via extraction pipeline
 */

// ============================================================================
// Zero Trust Security Policy
// ============================================================================

export const SECURITY_POLICY = {
  // Default deny for external sends
  externalSendDefaultDeny: true,
  
  // Require approval for these actions
  requireApproval: [
    "email.send",
    "sms.send",
    "browser.navigate",
    "app.submit",
    "financial.transaction",
    "persona.override",
  ],
  
  // Always allow (safety systems)
  alwaysAllow: [
    "identity.extract",
    "audit.append",
    "health.check",
    "sowwy.pause",
    "sowwy.status",
  ],
} as const;

// ============================================================================
// Threat Model Categories
// ============================================================================

export const THREAT_MODEL = {
  untrustedInbound: {
    description: "Untrusted inbound messages from public channels",
    mitigations: [
      "Input sanitization",
      "Content filtering",
      "Rate limiting per channel",
    ],
  },
  promptInjection: {
    description: "Prompt injection / tool misuse attempts",
    mitigations: [
      "Context isolation",
      "Tool permission boundaries",
      "Human-in-the-loop for critical actions",
    ],
  },
  credentialLeakage: {
    description: "Credential leakage via env, logs, or backups",
    mitigations: [
      "Secrets isolation",
      "Structured logging without secrets",
      "Encrypted backups",
    ],
  },
  gatewayAccess: {
    description: "Unauthorized gateway access",
    mitigations: [
      "Token authentication",
      "Device pairing only",
      "Loopback binding",
    ],
  } as const,
};

// ============================================================================
// Security Gate Types
// ============================================================================

export type SecurityGate =
  | { type: "approval_required"; action: string }
  | { type: "channel_allowlist"; allowed: string[] }
  | { type: "persona_restriction"; personas: string[] }
  | { type: "human_in_loop" }
  | { type: "rate_limit"; maxPerHour: number };

// ============================================================================
// Gateway Hardening Config
// ============================================================================

export const GATEWAY_HARDENING = {
  bindAddress: "127.0.0.1", // Loopback only
  requireToken: true,
  dmPolicy: "pairing", // Pairing-only DMs
  defaultAllowlist: [] as string[], // Empty = deny by default
};

// ============================================================================
// Network Hardening Config
// ============================================================================

export const NETWORK_HARDENING = {
  firewallAllowlist: [
    // Add specific IPs/ports here
  ],
  ssh: {
    keyAuthOnly: true,
    passwordAuth: false,
    fail2ban: true,
  },
};

// ============================================================================
// Sandbox Policy
// ============================================================================

export const SANDBOX_POLICY = {
  defaultMode: "non-main", // Non-main session for task execution
  toolAllowlist: {
    // Per persona tool restrictions
  },
  highRiskTools: [
    "browser.*",
    "system.run",
    "file.write",
    "gateway.*",
  ],
} as const;
