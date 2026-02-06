import type { Command } from "commander";
import { roadmapActivateCommand } from "../../commands/roadmap-activate.js";

export function registerRoadmapCommand(program: Command): void {
  const roadmap = program.command("roadmap").description("SOWWY Roadmap Observer commands");

  roadmap
    .command("activate")
    .description("Create initial Roadmap Observer task to monitor README Section 12")
    .action(async () => {
      await roadmapActivateCommand();
    });
}
