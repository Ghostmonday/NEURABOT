/**
 * Safety Limits - Crash Prevention
 *
 * Defines hard limits and adaptive throttling to prevent system crashes
 * under high load. These limits are enforced before task creation/execution.
 */

import { checkResources } from "../monitoring/resource-monitor.js";

// ============================================================================
// Safety Limit Configuration
// ============================================================================

export interface SafetyLimitsConfig {
  /** Maximum concurrent tasks across all personas */
  maxGlobalConcurrent: number;
  /** Maximum tasks in queue (BACKLOG + READY + IN_PROGRESS) */
  maxQueueSize: number;
  /** Memory threshold (MB) - start throttling */
  memoryThrottleMB: number;
  /** Memory threshold (MB) - hard stop */
  memoryHardLimitMB: number;
  /** Maximum concurrent builds */
  maxConcurrentBuilds: number;
  /** Maximum concurrent self-modify operations */
  maxConcurrentSelfModify: number;
}

export const DEFAULT_SAFETY_LIMITS: SafetyLimitsConfig = {
  maxGlobalConcurrent: 32, // Total concurrent tasks across all personas
  maxQueueSize: 100, // Total tasks in queue
  memoryThrottleMB: 800, // Start throttling at 800MB RSS
  memoryHardLimitMB: 950, // Hard stop at 950MB RSS
  maxConcurrentBuilds: 1, // Only one build at a time (builds are expensive)
  maxConcurrentSelfModify: 2, // Max 2 self-modify operations concurrently
};

// ============================================================================
// Safety Limit Checker
// ============================================================================

export class SafetyLimitsChecker {
  private config: SafetyLimitsConfig;
  private activeBuilds = 0;
  private activeSelfModify = 0;

  constructor(config: Partial<SafetyLimitsConfig> = {}) {
    this.config = { ...DEFAULT_SAFETY_LIMITS, ...config };
  }

  /**
   * Check if system can accept new tasks.
   * Returns true if safe to proceed, false if should throttle.
   */
  canAcceptTasks(
    currentQueueSize: number,
    currentConcurrent: number,
    opts?: { isBuild?: boolean; isSelfModify?: boolean },
  ): { allowed: boolean; reason?: string } {
    // Check memory first (most critical)
    const resources = checkResources({ maxMemoryMB: this.config.memoryHardLimitMB });
    if (resources.memory.rssMB >= this.config.memoryHardLimitMB) {
      return {
        allowed: false,
        reason: `Memory hard limit exceeded: ${resources.memory.rssMB}MB >= ${this.config.memoryHardLimitMB}MB`,
      };
    }

    // Check memory throttle
    if (resources.memory.rssMB >= this.config.memoryThrottleMB) {
      return {
        allowed: false,
        reason: `Memory throttle: ${resources.memory.rssMB}MB >= ${this.config.memoryThrottleMB}MB`,
      };
    }

    // Check queue size
    if (currentQueueSize >= this.config.maxQueueSize) {
      return {
        allowed: false,
        reason: `Queue size limit exceeded: ${currentQueueSize} >= ${this.config.maxQueueSize}`,
      };
    }

    // Check global concurrent limit
    if (currentConcurrent >= this.config.maxGlobalConcurrent) {
      return {
        allowed: false,
        reason: `Global concurrent limit exceeded: ${currentConcurrent} >= ${this.config.maxGlobalConcurrent}`,
      };
    }

    // Check build concurrency
    if (opts?.isBuild && this.activeBuilds >= this.config.maxConcurrentBuilds) {
      return {
        allowed: false,
        reason: `Build concurrency limit: ${this.activeBuilds} >= ${this.config.maxConcurrentBuilds}`,
      };
    }

    // Check self-modify concurrency
    if (opts?.isSelfModify && this.activeSelfModify >= this.config.maxConcurrentSelfModify) {
      return {
        allowed: false,
        reason: `Self-modify concurrency limit: ${this.activeSelfModify} >= ${this.config.maxConcurrentSelfModify}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Register a build operation starting
   */
  registerBuildStart(): void {
    this.activeBuilds++;
  }

  /**
   * Register a build operation completing
   */
  registerBuildEnd(): void {
    this.activeBuilds = Math.max(0, this.activeBuilds - 1);
  }

  /**
   * Register a self-modify operation starting
   */
  registerSelfModifyStart(): void {
    this.activeSelfModify++;
  }

  /**
   * Register a self-modify operation completing
   */
  registerSelfModifyEnd(): void {
    this.activeSelfModify = Math.max(0, this.activeSelfModify - 1);
  }

  /**
   * Get current safety status
   */
  getStatus(): {
    activeBuilds: number;
    activeSelfModify: number;
    memoryMB: number;
    memoryThrottled: boolean;
    memoryHardLimited: boolean;
  } {
    const resources = checkResources({ maxMemoryMB: this.config.memoryHardLimitMB });
    return {
      activeBuilds: this.activeBuilds,
      activeSelfModify: this.activeSelfModify,
      memoryMB: resources.memory.rssMB,
      memoryThrottled: resources.memory.rssMB >= this.config.memoryThrottleMB,
      memoryHardLimited: resources.memory.rssMB >= this.config.memoryHardLimitMB,
    };
  }
}

// ============================================================================
// Global Safety Limits Instance
// ============================================================================

let globalSafetyLimits: SafetyLimitsChecker | null = null;

export function getSafetyLimits(): SafetyLimitsChecker {
  if (!globalSafetyLimits) {
    globalSafetyLimits = new SafetyLimitsChecker();
  }
  return globalSafetyLimits;
}

export function setSafetyLimits(limits: SafetyLimitsChecker): void {
  globalSafetyLimits = limits;
}
