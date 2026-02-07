/**
 * Sowwy SMT (System Management Throttler)
 *
 * ⚠️ SAFETY CRITICAL: This throttler prevents runaway execution.
 *
 * PROTECTION SCOPE (what SMT THROTTLES):
 * - Task admission (new tasks wait)
 * - Persona execution (LLM calls)
 * - External API calls (Twilio, Proton, etc.)
 *
 * PROTECTION SCOPE (what SMT DOES NOT THROTTLE):
 * - Identity extraction (must always learn - never gate learning)
 * - Audit logging (must always record - never gate observability)
 * - Kill switch (must always work - never gate safety)
 * - Health checks (must always respond - never gate monitoring)
 *
 * ⚠️ PERFORMANCE:
 * - This class is accessed frequently
 * - Keep operations O(1) or O(log n)
 * - No async operations in canProceed()
 * - Atomic state updates only
 *
 * ⚠️ WHY THIS DISTINCTION MATTERS:
 * Under load, safety systems must never be gated.
 * If you're tempted to throttle identity/audit/kill, STOP.
 * The solution is elsewhere, not in throttling safety systems.
 */

// ============================================================================
// SMT Configuration
// ============================================================================

/**
 * Window size matters. 5 hours means:
 * - If you hit 500 prompts, you wait up to 5 hours
 * - The window resets automatically
 * - Consider business hours when tuning
 */
export interface SMTConfig {
  windowMs: number; // Time window in milliseconds (default: 5 hours)
  maxPrompts: number; // Max operations per window (default: 500)
  targetUtilization: number; // Target utilization (default: 0.80)
  reservePercent: number; // Reserve for priority categories (default: 0.20)
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_SMT_CONFIG: SMTConfig = {
  windowMs: 5 * 60 * 60 * 1000, // 5 hours
  maxPrompts: 500, // Minimax Enterprise
  targetUtilization: 0.95, // 95% target utilization
  reservePercent: 0.2, // 20% reserve
};

// ============================================================================
// Operations that bypass throttling (protection scope)
// ============================================================================

export const UNTHROTTLED_OPERATIONS = new Set([
  "identity.extract", // Must always learn
  "audit.append", // Must always record
  "health.check", // Must always respond
  "sowwy.pause", // Kill switch
  "sowwy.status", // Status check
]);

// ============================================================================
// SMT State
// ============================================================================

export interface SMTState {
  usedInWindow: number;
  windowStart: number;
  isPaused: boolean;
  burstMode: boolean;
}

// ============================================================================
// SMT Throttler Class
// ============================================================================

export class SMTThrottler {
  private config: SMTConfig;
  private state: SMTState;

  constructor(config: Partial<SMTConfig> = {}) {
    this.config = { ...DEFAULT_SMT_CONFIG, ...config };
    this.state = {
      usedInWindow: 0,
      windowStart: Date.now(),
      isPaused: false,
      burstMode: false,
    };
  }

  /**
   * Check if an operation can proceed
   */
  canProceed(operation: string, category?: string): boolean {
    // Safety systems never throttled
    if (UNTHROTTLED_OPERATIONS.has(operation)) {
      return true;
    }

    // Check pause state
    if (this.state.isPaused) {
      return false;
    }

    // Check window reset
    this.checkWindowReset();

    const limit = this.getEffectiveLimit(category);
    return this.state.usedInWindow < limit;
  }

  /**
   * Record an operation as used
   */
  record(operation: string): void {
    if (UNTHROTTLED_OPERATIONS.has(operation)) {
      return;
    }

    this.checkWindowReset();
    this.state.usedInWindow++;
  }

  /**
   * Alias for record()
   */
  recordUsage(operation: string): void {
    this.record(operation);
  }

  /**
   * Get current utilization percentage
   */
  getUtilization(): number {
    const limit = this.config.maxPrompts * this.config.targetUtilization;
    return this.state.usedInWindow / limit;
  }

  /**
   * Get remaining operations in current window
   */
  getRemaining(): number {
    const limit = this.config.maxPrompts * this.config.targetUtilization;
    return Math.max(0, limit - this.state.usedInWindow);
  }

  /**
   * Enable burst mode for crisis situations
   */
  enableBurstMode(): void {
    this.state.burstMode = true;
  }

  /**
   * Disable burst mode
   */
  disableBurstMode(): void {
    this.state.burstMode = false;
  }

  /**
   * Global pause (kill switch active)
   */
  pause(): void {
    this.state.isPaused = true;
  }

  /**
   * Resume from pause
   */
  resume(): void {
    this.state.isPaused = false;
  }

  /**
   * Check if throttler is paused
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Check if burst mode is enabled
   */
  getBurstMode(): boolean {
    return this.state.burstMode;
  }

  /**
   * Get the timestamp when the current window ends
   */
  getWindowEnd(): number {
    this.checkWindowReset();
    return this.state.windowStart + this.config.windowMs;
  }

  /**
   * Get current state (read-only, for tests and debugging)
   */
  getState(): Readonly<SMTState> {
    return { ...this.state };
  }

  /**
   * Reset the throttling window
   */
  reset(): void {
    this.state.usedInWindow = 0;
    this.state.windowStart = Date.now();
  }

  // Private methods

  private checkWindowReset(): void {
    const elapsed = Date.now() - this.state.windowStart;
    if (elapsed >= this.config.windowMs) {
      this.state.usedInWindow = 0;
      this.state.windowStart = Date.now();
    }
  }

  private getEffectiveLimit(category?: string): number {
    // Burst mode ignores limits
    if (this.state.burstMode) {
      return this.config.maxPrompts;
    }

    // Reserve check for priority categories (LEGAL, EMAIL)
    if (category === "LEGAL" || category === "EMAIL") {
      return Math.floor(this.config.maxPrompts * (1 - this.config.reservePercent * 0.5));
    }

    return Math.floor(this.config.maxPrompts * this.config.targetUtilization);
  }
}

// ============================================================================
// SMT Metrics Interface
// ============================================================================

export interface SMTMetrics {
  utilization: number;
  remaining: number;
  isPaused: boolean;
  burstMode: boolean;
  windowEnd: number;
}

export function getMetrics(throttler: SMTThrottler): SMTMetrics {
  return {
    utilization: throttler.getUtilization(),
    remaining: throttler.getRemaining(),
    isPaused: throttler.isPaused(),
    burstMode: throttler.getBurstMode(),
    windowEnd: throttler.getWindowEnd(),
  };
}
