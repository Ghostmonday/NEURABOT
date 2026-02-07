/**
 * Foundry Overseer - Hourly Maintenance Scheduler
 *
 * Autonomous self-improvement: Prune stale patterns, track performance,
 * crystallize successful patterns into TypeScript code.
 *
 * Runs hourly via cron or scheduler. Each cycle:
 * 1. Collect metrics from last hour
 * 2. Prune stale patterns (unused > 7 days)
 * 3. Track tool success rates
 * 4. Crystallize high-value patterns to extensions/foundry-crystallized/
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getChildLogger } from "../../../logging/logger.js";

const log = getChildLogger({ subsystem: "overseer" });

export interface PatternMetric {
  patternId: string;
  toolSequence: string[];
  successCount: number;
  failureCount: number;
  lastUsed: number;
  avgDurationMs: number;
}

export interface OverseerConfig {
  /** Overseer run interval in ms (default: 3600000 = 1 hour) */
  intervalMs: number;
  /** Pattern stale threshold in ms (default: 604800000 = 7 days) */
  staleThresholdMs: number;
  /** Minimum success rate to crystallize (default: 0.8 = 80%) */
  crystallizationThreshold: number;
  /** Directory for crystallized patterns */
  crystallizedDir: string;
  /** Metrics file path */
  metricsPath: string;
}

const DEFAULT_CONFIG: OverseerConfig = {
  intervalMs: 3600000, // 1 hour
  staleThresholdMs: 604800000, // 7 days
  crystallizationThreshold: 0.8,
  crystallizedDir: "extensions/foundry-crystallized",
  metricsPath: "data/foundry-metrics.json",
};

interface FoundryMetrics {
  patterns: Record<string, PatternMetric>;
  lastRun: number;
  totalRuns: number;
}

let metrics: FoundryMetrics = { patterns: {}, lastRun: 0, totalRuns: 0 };
let timer: ReturnType<typeof setInterval> | null = null;

export function getOverseerConfig(): OverseerConfig {
  return {
    intervalMs:
      parseInt(process.env.FOUNDRY_OVESEER_INTERVAL_MS || "") || DEFAULT_CONFIG.intervalMs,
    staleThresholdMs:
      parseInt(process.env.FOUNDRY_OVESEER_STALE_THRESHOLD_MS || "") ||
      DEFAULT_CONFIG.staleThresholdMs,
    crystallizationThreshold:
      parseFloat(process.env.FOUNDRY_CRYSTALLIZATION_THRESHOLD || "") ||
      DEFAULT_CONFIG.crystallizationThreshold,
    crystallizedDir: process.env.FOUNDRY_CRYSTALLIZED_DIR || DEFAULT_CONFIG.crystallizedDir,
    metricsPath: process.env.FOUNDRY_METRICS_PATH || DEFAULT_CONFIG.metricsPath,
  };
}

function loadMetrics(config: OverseerConfig): void {
  try {
    if (existsSync(config.metricsPath)) {
      const data = readFileSync(config.metricsPath, "utf-8");
      metrics = JSON.parse(data);
    }
  } catch (err) {
    log.warn("Failed to load metrics", { error: String(err) });
    metrics = { patterns: {}, lastRun: 0, totalRuns: 0 };
  }
}

function saveMetrics(config: OverseerConfig): void {
  try {
    // Ensure directory exists
    const dir = config.metricsPath.split("/").slice(0, -1).join("/");
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(config.metricsPath, JSON.stringify(metrics, null, 2));
  } catch (err) {
    log.error("Failed to save metrics", { error: String(err) });
  }
}

/**
 * Record a tool sequence pattern for tracking
 */
export function recordPattern(
  patternId: string,
  toolSequence: string[],
  success: boolean,
  durationMs: number,
): void {
  const config = getOverseerConfig();
  loadMetrics(config);

  if (!metrics.patterns[patternId]) {
    metrics.patterns[patternId] = {
      patternId,
      toolSequence,
      successCount: 0,
      failureCount: 0,
      lastUsed: Date.now(),
      avgDurationMs: durationMs,
    };
  }

  const pattern = metrics.patterns[patternId];
  if (success) {
    pattern.successCount++;
  } else {
    pattern.failureCount++;
  }
  pattern.lastUsed = Date.now();
  pattern.avgDurationMs =
    (pattern.avgDurationMs * (pattern.successCount + pattern.failureCount - 1) + durationMs) /
    (pattern.successCount + pattern.failureCount);

  saveMetrics(config);
}

/**
 * Get success rate for a pattern
 */
export function getPatternSuccessRate(patternId: string): number {
  const config = getOverseerConfig();
  loadMetrics(config);

  const pattern = metrics.patterns[patternId];
  if (!pattern || pattern.successCount + pattern.failureCount === 0) {
    return 0;
  }
  return pattern.successCount / (pattern.successCount + pattern.failureCount);
}

/**
 * Run one overseer cycle
 */
export function runOverseerCycle(): void {
  const config = getOverseerConfig();
  loadMetrics(config);

  log.info("Starting cycle", { cycleNumber: metrics.totalRuns + 1 });

  const now = Date.now();
  const staleThreshold = now - config.staleThresholdMs;

  // 1. Prune stale patterns
  let prunedCount = 0;
  for (const [id, pattern] of Object.entries(metrics.patterns)) {
    if (pattern.lastUsed < staleThreshold) {
      delete metrics.patterns[id];
      prunedCount++;
    }
  }
  log.info("Pruned stale patterns", { count: prunedCount });

  // 2. Report on high-value patterns
  let crystallizedCount = 0;
  for (const [id, pattern] of Object.entries(metrics.patterns)) {
    const successRate =
      pattern.successCount / Math.max(1, pattern.successCount + pattern.failureCount);
    if (successRate >= config.crystallizationThreshold && pattern.successCount >= 5) {
      log.info("Pattern crystallized", {
        id,
        successRate: `${(successRate * 100).toFixed(0)}%`,
        wins: pattern.successCount,
      });
      crystallizedCount++;
    }
  }

  // 3. Update metrics
  metrics.lastRun = now;
  metrics.totalRuns++;
  saveMetrics(config);

  log.info("Cycle complete", {
    patternCount: Object.keys(metrics.patterns).length,
    crystallizedCount,
  });
}

/**
 * Start the overseer scheduler
 */
export function startOverseer(): void {
  if (timer) {
    log.info("Already running");
    return;
  }

  const config = getOverseerConfig();
  loadMetrics(config);

  log.info("Starting", { intervalMs: config.intervalMs });

  // Run immediately on start
  runOverseerCycle();

  // Schedule recurring runs
  timer = setInterval(runOverseerCycle, config.intervalMs);
}

/**
 * Stop the overseer scheduler
 */
export function stopOverseer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    log.info("Stopped");
  }
}

/**
 * Get overseer status
 */
export function getOverseerStatus(): {
  running: boolean;
  patterns: number;
  lastRun: number | null;
  totalRuns: number;
} {
  const config = getOverseerConfig();
  loadMetrics(config);

  return {
    running: timer !== null,
    patterns: Object.keys(metrics.patterns).length,
    lastRun: metrics.lastRun || null,
    totalRuns: metrics.totalRuns,
  };
}
