/**
 * Sowwy Circuit Breaker - Foundation
 * 
 * ⚠️ EXTERNAL DEPENDENCY PROTECTION:
 * Circuit breakers prevent cascade failures from external APIs.
 * If Twilio is down, we fail fast instead of hanging.
 * If Proton is slow, we stop waiting and try alternatives.
 * 
 * ⚠️ STATE SEMANTICS:
 * - CLOSED: Normal operation, calls go through
 * - OPEN: Failure threshold reached, calls fail immediately
 * - HALF_OPEN: Testing if service recovered, limited calls allowed
 * 
 * ⚠️ IMPORTANT BEHAVIORS:
 * - On success in HALF_OPEN: increment success count
 * - On failure: increment failure count, check threshold
 * - Never automatically close from HALF_OPEN - requires N successes
 * - Don't open on first failure - allow for transient issues
 * 
 * ⚠️ TIMEOUTS:
 * - timeoutMs is critical - don't make it too long
 * - 30 seconds is reasonable for most APIs
 * - If your operation takes longer, reconsider the design
 * 
 * ⚠️ THRESHOLDS:
 * - failureThreshold=5: Allows transient failures
 * - successThreshold=3: Confirms recovery before closing
 * - These numbers work for most APIs - don't lower them
 */

import { SMTThrottler } from "../smt/throttler.js";

// ============================================================================
// Circuit Breaker States
// ============================================================================

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

// ============================================================================
// Circuit Breaker Config
// ============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures before opening
  successThreshold: number;     // Successes before closing (HALF_OPEN)
  cooldownMs: number;           // Time before attempting HALF_OPEN
  timeoutMs: number;            // Operation timeout
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  cooldownMs: 60000,            // 1 minute
  timeoutMs: 30000,             // 30 seconds
};

// ============================================================================
// Circuit Breaker State
// ============================================================================

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: Date | null;
  lastStateChange: Date;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private operation: () => Promise<unknown>;
  
  constructor(
    operation: () => Promise<unknown>,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.operation = operation;
    this.state = {
      state: "CLOSED",
      failures: 0,
      successes: 0,
      lastFailureAt: null,
      lastStateChange: new Date(),
    };
  }
  
  /**
   * Execute the protected operation
   */
  async execute<T>(): Promise<T> {
    if (this.state.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.transitionTo("HALF_OPEN");
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.config.cooldownMs}ms`);
      }
    }
    
    try {
      const result = await this.operation();
      this.onSuccess();
      return result as T;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }
  
  /**
   * Force state transition (for testing/admin)
   */
  forceState(state: CircuitState): void {
    this.transitionTo(state);
  }
  
  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = {
      state: "CLOSED",
      failures: 0,
      successes: 0,
      lastFailureAt: null,
      lastStateChange: new Date(),
    };
  }
  
  // Private methods
  
  private shouldAttemptReset(): boolean {
    const elapsed = Date.now() - this.state.lastStateChange.getTime();
    return elapsed >= this.config.cooldownMs;
  }
  
  private transitionTo(newState: CircuitState): void {
    this.state.state = newState;
    this.state.lastStateChange = new Date();
    
    if (newState === "HALF_OPEN") {
      this.state.successes = 0;
    }
  }
  
  private onSuccess(): void {
    if (this.state.state === "HALF_OPEN") {
      this.state.successes++;
      if (this.state.successes >= this.config.successThreshold) {
        this.transitionTo("CLOSED");
        this.state.failures = 0;
      }
    } else if (this.state.state === "CLOSED") {
      // Occasionally reset failure count for sliding window
      if (Math.random() < 0.01) {
        this.state.failures = Math.max(0, this.state.failures - 1);
      }
    }
  }
  
  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureAt = new Date();
    
    if (this.state.failures >= this.config.failureThreshold) {
      this.transitionTo("OPEN");
    }
  }
}

// ============================================================================
// Circuit Breaker Registry
// ============================================================================

export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker>;
  
  constructor() {
    this.breakers = new Map();
  }
  
  /**
   * Register a circuit breaker
   */
  register(name: string, breaker: CircuitBreaker): void {
    this.breakers.set(name, breaker);
  }
  
  /**
   * Get a circuit breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
  
  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getState();
    }
    return states;
  }
}

// ============================================================================
// Pre-configured Breakers
// ============================================================================

export const TWILIO_BREAKER = "twilio";
export const PROTON_BREAKER = "proton";
export const BROWSER_BREAKER = "browser";
export const DATABASE_BREAKER = "database";
