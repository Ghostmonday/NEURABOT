/**
 * Continuous Rust Watcher Extension
 *
 * Monitors neurabot-native/ every 2 minutes and creates parallel validation tasks:
 * - Per-persona checks (Dev validates core-native, RnD validates watchdog)
 * - Per-file checks (one task per .rs file for parallel clippy)
 * - Speculative fixes on any error (handled by self-modify-tool)
 *
 * Strategy: Maximum compute saturation via parallel execution across personas and files.
 * Enable via SOWWY_CONTINUOUS_RUST_WATCHER=true
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionFoundation, ExtensionLifecycle } from "../integration.js";
import { getChildLogger } from "../../../logging/logger.js";
import { TaskCategory, TaskStatus } from "../../mission-control/schema.js";

const RUST_WATCH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (high-throughput)
const PROJECT_ROOT = process.cwd();
const RUST_ROOT = join(PROJECT_ROOT, "neurabot-native");
const MAX_PENDING_CHECKS = 20; // Max concurrent RUST_CHECK tasks
const MAX_FILES_PER_CYCLE = 10; // Max file-level checks per cycle

const log = getChildLogger({ subsystem: "continuous-rust-watcher" });

export class ContinuousRustWatcherExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    if (process.env.SOWWY_CONTINUOUS_RUST_WATCHER === "true") {
      if (!existsSync(RUST_ROOT)) {
        log.warn("neurabot-native/ not found, skipping Rust watcher initialization");
        return;
      }

      await this.scheduleNextCycle();
      this.intervalId = setInterval(() => {
        this.scheduleNextCycle().catch((err) => {
          log.warn("Schedule cycle error (will retry next interval)", { error: err });
        });
      }, RUST_WATCH_INTERVAL_MS);

      log.info("Enabled: RUST_CHECK tasks", {
        intervalMinutes: RUST_WATCH_INTERVAL_MS / 60000,
      });
    }
  }

  private async scheduleNextCycle(): Promise<void> {
    if (!this.foundation || !existsSync(RUST_ROOT)) return;

    const store = this.foundation.getTaskStore();

    // Check pending RUST_CHECK tasks to avoid overloading the queue
    const pendingStatuses = [
      TaskStatus.BACKLOG,
      TaskStatus.READY,
      TaskStatus.IN_PROGRESS,
      TaskStatus.BLOCKED,
      TaskStatus.WAITING_ON_HUMAN,
    ];
    const pendingCounts = await Promise.all(
      pendingStatuses.map((status) => store.count({ status, category: TaskCategory.RUST_CHECK })),
    );
    const pending = pendingCounts.reduce((sum: number, count: number) => sum + count, 0);

    if (pending >= MAX_PENDING_CHECKS) {
      log.debug("Skipping cycle: too many pending RUST_CHECK tasks", {
        pending,
        maxPending: MAX_PENDING_CHECKS,
      });
      return;
    }

    // Strategy 1: Per-persona parallel validation (Dev -> core-native, RnD -> watchdog)
    await store.create({
      category: TaskCategory.RUST_CHECK,
      title: "Rust validation: core-native (Dev)",
      description:
        "Run cargo check + clippy on core-native crate\n\nMode: persona-parallel\nCrate: core-native",
      personaOwner: "Dev",
      urgency: 3,
      importance: 4,
      risk: 2,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      payload: { crate: "core-native", mode: "persona-parallel" },
      createdBy: "continuous-rust-watcher",
    });

    await store.create({
      category: TaskCategory.RUST_CHECK,
      title: "Rust validation: watchdog (RnD)",
      description:
        "Run cargo check + clippy on watchdog crate\n\nMode: persona-parallel\nCrate: watchdog",
      personaOwner: "RnD",
      urgency: 3,
      importance: 4,
      risk: 2,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      payload: { crate: "watchdog", mode: "persona-parallel" },
      createdBy: "continuous-rust-watcher",
    });

    // Strategy 2: Per-file parallel validation (one task per .rs file)
    // This enables fine-grained clippy checks and parallel execution across files
    try {
      const rustFiles = await this.findRustFiles();
      const filesToCheck = rustFiles.slice(0, MAX_FILES_PER_CYCLE); // Limit per cycle

      for (const file of filesToCheck) {
        const relativePath = file.replace(PROJECT_ROOT + "/", "");
        await store.create({
          category: TaskCategory.RUST_CHECK,
          title: `Rust check: ${relativePath}`,
          description: `Run clippy on single file for targeted validation\n\nMode: file-parallel\nFile: ${relativePath}`,
          personaOwner: file.includes("watchdog") ? "RnD" : "Dev",
          urgency: 2,
          importance: 3,
          risk: 1,
          stressCost: 1,
          requiresApproval: false,
          maxRetries: 1,
          dependencies: [],
          contextLinks: {},
          payload: { file: relativePath, mode: "file-parallel" },
          createdBy: "continuous-rust-watcher",
        });
      }

      log.debug("Scheduled Rust validation cycle", {
        personaTasks: 2,
        fileTasks: filesToCheck.length,
      });
    } catch (err) {
      log.warn("Failed to schedule file-level checks", { error: err });
    }
  }

  private async findRustFiles(): Promise<string[]> {
    const files: string[] = [];

    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== "target") {
            // Skip Cargo's build artifacts
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".rs")) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // Ignore permission errors, missing directories, etc.
      }
    };

    await scanDir(RUST_ROOT);
    return files;
  }

  async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      log.info("Stopped continuous Rust watcher");
    }
  }

  async tick(): Promise<void> {
    // No-op: watcher runs on its own interval
  }
}
