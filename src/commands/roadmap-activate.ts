/**
 * Roadmap Activate Command
 *
 * CLI command to create the initial MISSION_CONTROL task that triggers
 * the Roadmap Observer to monitor README Section 12 and create sub-tasks.
 */

import { loadConfig } from "../config/config.js";
import { defaultRuntime } from "../runtime.js";
import { createInMemoryStores, createPostgresStores } from "../sowwy/index.js";

export async function roadmapActivateCommand(): Promise<void> {
  const cfg = loadConfig();

  // Create stores (same logic as bootstrap)
  const pgHost = process.env.SOWWY_POSTGRES_HOST?.trim();
  const stores =
    pgHost && process.env.SOWWY_DB_TYPE !== "memory"
      ? await createPostgresStores({
          host: pgHost,
          port: Number.parseInt(process.env.SOWWY_POSTGRES_PORT || "5432", 10),
          user: process.env.SOWWY_POSTGRES_USER || "sowwy",
          password: process.env.SOWWY_POSTGRES_PASSWORD || "",
          database: process.env.SOWWY_POSTGRES_DB || "sowwy",
        })
      : createInMemoryStores();

  try {
    // Check if MISSION_CONTROL task already exists
    const existingTasks = await stores.tasks.list({
      category: "MISSION_CONTROL",
      limit: 10,
    });

    const roadmapTasks = existingTasks.filter(
      (t) =>
        t.payload?.action === "read_readme_roadmap" &&
        (t.status === "BACKLOG" || t.status === "READY" || t.status === "IN_PROGRESS"),
    );

    if (roadmapTasks.length > 0) {
      defaultRuntime.log(
        `\n⚠️  Roadmap Observer task already exists (${roadmapTasks.length} active):\n`,
      );
      for (const task of roadmapTasks) {
        defaultRuntime.log(`   • ${task.taskId.slice(0, 8)}... - ${task.title} [${task.status}]`);
      }
      defaultRuntime.log(
        '\n💡 Tip: View all tasks with: npx pm2 logs neurabot-gateway | grep "MISSION_CONTROL"\n',
      );
      return;
    }

    // Create the initial MISSION_CONTROL task
    const task = await stores.tasks.create({
      title: "Monitor README Roadmap Progress",
      description:
        "Continuously monitor Section 12 roadmap (iOS, Tuta Mail, Calendar) and create sub-tasks for incomplete tracks. Respects Constitution §0 safety constraints.",
      category: "MISSION_CONTROL",
      personaOwner: "ChiefOfStaff",
      urgency: 5,
      importance: 5,
      risk: 2,
      stressCost: 2,
      requiresApproval: false,
      maxRetries: 3,
      dependencies: [],
      contextLinks: {},
      payload: {
        action: "read_readme_roadmap",
        persist_until_complete: true,
      },
      createdBy: "cli",
    });

    defaultRuntime.log("\n╔════════════════════════════════════════════════════════════════╗");
    defaultRuntime.log("║     Roadmap Observer Activated - Mission Control Online       ║");
    defaultRuntime.log("╚════════════════════════════════════════════════════════════════╝\n");
    defaultRuntime.log(`✅ Created Roadmap Observer task: ${task.taskId.slice(0, 8)}...\n`);
    defaultRuntime.log("📋 Task Details:");
    defaultRuntime.log(`   Title:    ${task.title}`);
    defaultRuntime.log(`   Category: ${task.category}`);
    defaultRuntime.log(`   Persona:  ${task.personaOwner}`);
    defaultRuntime.log(`   Status:   ${task.status}`);
    defaultRuntime.log("");
    defaultRuntime.log("🎯 What happens next:");
    defaultRuntime.log("   1. SOWWY scheduler will pick up this task on next poll (5s)");
    defaultRuntime.log("   2. Roadmap Observer reads README.md Section 12");
    defaultRuntime.log("   3. Parses Track 1 (iOS), Track 2 (Tuta Mail), Track 3 (Calendar)");
    defaultRuntime.log("   4. Creates sub-tasks for incomplete tracks");
    defaultRuntime.log("   5. Schedules follow-up check in 1 hour");
    defaultRuntime.log("");
    defaultRuntime.log("🛡️  Constitutional Safety (README §0):");
    defaultRuntime.log("   ✓ Approval gates for high-risk actions");
    defaultRuntime.log("   ✓ SMT throttling (100 prompts per 5 hours)");
    defaultRuntime.log("   ✓ Watchdog monitoring");
    defaultRuntime.log("   ✓ Max 10 sub-tasks per execution");
    defaultRuntime.log("");
    defaultRuntime.log("📊 Monitor Progress:");
    defaultRuntime.log("   View logs:  npx pm2 logs neurabot-gateway");
    defaultRuntime.log("   List tasks: node dist/index.js tasks:list");
    defaultRuntime.log("   Dashboard:  http://127.0.0.1:18789\n");
  } catch (err) {
    defaultRuntime.error(
      `\n❌ Failed to create Roadmap Observer task: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    defaultRuntime.exit(1);
  }
}
