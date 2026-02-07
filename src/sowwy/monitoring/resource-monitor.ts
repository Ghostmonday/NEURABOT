/**
 * Resource Monitor - Memory, CPU, Disk Monitoring
 *
 * Monitors system resources and provides status/threshold checks.
 * Used by scheduler to pause execution when resources are constrained.
 */

import { statfs } from "node:fs/promises";
import * as os from "node:os";
import * as process from "node:process";

export interface ResourceStatus {
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    externalMB: number;
    systemFreeMB: number;
    systemTotalMB: number;
    systemUsedPercent: number;
  };
  disk: {
    freeMB: number;
    totalMB: number;
    usedPercent: number;
    path: string;
  };
  thresholds: {
    memoryWarn: boolean; // RSS > 85% of max_memory_restart
    memoryCritical: boolean; // RSS > 95% of max_memory_restart
    diskWarn: boolean; // < 1GB free
    diskCritical: boolean; // < 500MB free
  };
  shouldPause: boolean; // True if scheduler should pause
}

const DEFAULT_MAX_MEMORY_MB = 1024; // PM2 max_memory_restart default
const MEMORY_WARN_THRESHOLD = 0.85; // 85% of max memory
const MEMORY_CRITICAL_THRESHOLD = 0.95; // 95% of max memory
const DISK_WARN_THRESHOLD_MB = 1024; // 1GB free
const DISK_CRITICAL_THRESHOLD_MB = 500; // 500MB free

/**
 * Check current resource status
 */
export function checkResources(opts?: { maxMemoryMB?: number; diskPath?: string }): ResourceStatus {
  const maxMemoryMB = opts?.maxMemoryMB ?? DEFAULT_MAX_MEMORY_MB;
  const diskPath = opts?.diskPath ?? process.cwd();

  // Memory stats
  const memUsage = process.memoryUsage();
  const systemMem = os.totalmem();
  const systemFree = os.freemem();

  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);
  const systemFreeMB = Math.round(systemFree / 1024 / 1024);
  const systemTotalMB = Math.round(systemMem / 1024 / 1024);
  const systemUsedPercent = ((systemMem - systemFree) / systemMem) * 100;

  // Memory thresholds (based on RSS vs max_memory_restart)
  const memoryWarn = rssMB > maxMemoryMB * MEMORY_WARN_THRESHOLD;
  const memoryCritical = rssMB > maxMemoryMB * MEMORY_CRITICAL_THRESHOLD;

  // Disk stats
  let diskFreeMB = 0;
  let diskTotalMB = 0;
  let diskUsedPercent = 0;

  try {
    // Try to get actual disk stats using statfs (Linux) or statvfs
    const fs = require("fs");
    const stats = fs.statSync(diskPath);
    // For now, use a simple heuristic: assume disk is similar to system memory
    // In production, consider using a library like 'diskusage' for accurate stats
    // This is a best-effort check
    const { execSync } = require("child_process");
    try {
      // Try df command for accurate disk stats
      const dfOutput = execSync(`df -m "${diskPath}"`, { encoding: "utf8", timeout: 1000 });
      const lines = dfOutput.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        if (parts.length >= 4) {
          diskTotalMB = parseInt(parts[1], 10) || systemTotalMB;
          diskFreeMB = parseInt(parts[3], 10) || systemFreeMB;
          diskUsedPercent = diskTotalMB > 0 ? ((diskTotalMB - diskFreeMB) / diskTotalMB) * 100 : 0;
        }
      }
    } catch {
      // INTENTIONAL: Fallback to system memory estimate if df command fails (non-critical)
      diskFreeMB = systemFreeMB;
      diskTotalMB = systemTotalMB;
      diskUsedPercent = systemUsedPercent;
    }
  } catch {
    // INTENTIONAL: Fallback to system memory estimate if disk check fails entirely (non-critical)
    diskFreeMB = systemFreeMB;
    diskTotalMB = systemTotalMB;
    diskUsedPercent = systemUsedPercent;
  }

  const diskWarn = diskFreeMB < DISK_WARN_THRESHOLD_MB;
  const diskCritical = diskFreeMB < DISK_CRITICAL_THRESHOLD_MB;

  const shouldPause = memoryCritical || diskCritical;

  return {
    memory: {
      heapUsedMB,
      heapTotalMB,
      rssMB,
      externalMB,
      systemFreeMB,
      systemTotalMB,
      systemUsedPercent: Math.round(systemUsedPercent * 100) / 100,
    },
    disk: {
      freeMB: diskFreeMB,
      totalMB: diskTotalMB,
      usedPercent: Math.round(diskUsedPercent * 100) / 100,
      path: diskPath,
    },
    thresholds: {
      memoryWarn,
      memoryCritical,
      diskWarn,
      diskCritical,
    },
    shouldPause,
  };
}

/**
 * Get resource status as a human-readable string
 */
export function formatResourceStatus(status: ResourceStatus): string {
  const parts: string[] = [];
  parts.push(`Memory: ${status.memory.rssMB}MB RSS / ${status.memory.heapUsedMB}MB heap`);
  if (status.thresholds.memoryWarn) {
    parts.push(`⚠️  Memory warning`);
  }
  if (status.thresholds.memoryCritical) {
    parts.push(`🚨 Memory critical`);
  }
  parts.push(`Disk: ${status.disk.freeMB}MB free (${status.disk.usedPercent}% used)`);
  if (status.thresholds.diskWarn) {
    parts.push(`⚠️  Disk warning`);
  }
  if (status.thresholds.diskCritical) {
    parts.push(`🚨 Disk critical`);
  }
  if (status.shouldPause) {
    parts.push(`⏸️  Scheduler paused`);
  }
  return parts.join(" | ");
}
