/**
 * OpenClaw → Sowwy Data Migration Foundation
 *
 * Migrates existing OpenClaw data to Sowwy format:
 * - Sessions → Tasks (for historical context)
 * - Skills → Persona skills
 * - Config → Sowwy config
 */

import { safeStringify } from "../security/redact.js";

// ============================================================================
// Migration Types
// ============================================================================

export interface MigrationOptions {
  dryRun?: boolean;
  includeSkills?: boolean;
  includeSessions?: boolean;
  includeConfig?: boolean;
}

export interface MigrationResult {
  tasksCreated: number;
  skillsMigrated: number;
  configMerged: boolean;
  errors: string[];
}

// ============================================================================
// Migration Class
// ============================================================================

export class OpenClawMigration {
  private options: MigrationOptions;

  constructor(options: MigrationOptions = {}) {
    this.options = {
      dryRun: false,
      includeSkills: true,
      includeSessions: true,
      includeConfig: true,
      ...options,
    };
  }

  /**
   * Run the migration
   */
  async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      tasksCreated: 0,
      skillsMigrated: 0,
      configMerged: false,
      errors: [],
    };

    try {
      // Migrate sessions to tasks
      if (this.options.includeSessions) {
        const sessionCount = await this.migrateSessions();
        result.tasksCreated = sessionCount;
      }

      // Migrate skills to persona skills
      if (this.options.includeSkills) {
        const skillCount = await this.migrateSkills();
        result.skillsMigrated = skillCount;
      }

      // Merge config
      if (this.options.includeConfig) {
        result.configMerged = await this.migrateConfig();
      }
    } catch (error) {
      result.errors.push(String(error));
    }

    return result;
  }

  /**
   * Preview migration without making changes
   */
  async preview(): Promise<MigrationResult> {
    const originalDryRun = this.options.dryRun;
    this.options.dryRun = true;
    const result = await this.migrate();
    this.options.dryRun = originalDryRun;
    return result;
  }

  /**
   * Rollback migration
   */
  async rollback(): Promise<void> {
    // TODO: Implement rollback logic
    console.log("[Migration] Rollback not yet implemented"); // No secrets in this log
  }

  // Private methods

  private async migrateSessions(): Promise<number> {
    // TODO: Load OpenClaw sessions
    // Convert actionable sessions to tasks
    return 0;
  }

  private async migrateSkills(): Promise<number> {
    // TODO: Load OpenClaw skills
    // Copy persona-appropriate skills
    return 0;
  }

  private async migrateConfig(): Promise<boolean> {
    // TODO: Load OpenClaw config
    // Merge into Sowwy config
    return true;
  }
}

// ============================================================================
// Migration CLI
// ============================================================================

export async function runMigration(args: string[]): Promise<void> {
  const dryRun = args.includes("--dry-run");
  const rollback = args.includes("--rollback");

  if (rollback) {
    const migration = new OpenClawMigration();
    await migration.rollback();
    return;
  }

  const migration = new OpenClawMigration({ dryRun });
  const result = await migration.migrate();

  console.log("[Migration] Result:", safeStringify(result, 2));
}
