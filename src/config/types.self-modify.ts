/**
 * Self-Modify Configuration Types
 *
 * Defines configuration options for self-modification behavior.
 * Supports both config-based and environment variable-based poweruser mode.
 */

export type SelfModifyConfig = {
  /** Enable poweruser mode (higher diff thresholds, relaxed boundaries). */
  poweruser?: boolean;
  /** Maximum diff ratio per file (0.0-1.0). Default: 0.5. */
  diffThreshold?: number;
  /** Skip secrets check during validation. Default: false. */
  skipSecretsCheck?: boolean;
  /** Skip syntax validation. Default: false. */
  skipSyntaxCheck?: boolean;
  /** Build command to use. Default: "pnpm build". */
  buildCommand?: string;
  /** Build timeout in ms. Default: 120000. */
  buildTimeoutMs?: number;
  /** Enable auto-rollback on health check failure. Default: true. */
  autoRollback?: boolean;
  /** Health check timeout in ms. Default: 15000. */
  healthCheckTimeoutMs?: number;
  /** Maximum consecutive health check failures before rollback. Default: 3. */
  maxConsecutiveFailures?: number;
};
