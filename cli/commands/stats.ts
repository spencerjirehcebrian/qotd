import type { Command } from "commander";
import { createDataClient } from "../lib/data-client";
import { formatStatsTable } from "../lib/format";
import { info, error } from "../lib/output";

export function registerStatsCommand(program: Command) {
  const cmd = program
    .command("stats")
    .description("Show question database statistics")
    .action(async () => {
      try {
        const client = createDataClient();
        const stats = await client.getStats();

        info("Question Statistics");
        info(`Total questions: ${stats.total}`);
        console.log();
        info("By Category:");
        console.log(
          formatStatsTable(
            stats.byCategory.map((c) => ({
              label: c.name,
              count: c.count,
            }))
          )
        );
        console.log();
        info("By Seriousness Level:");
        console.log(
          formatStatsTable(
            stats.byLevel.map((l) => ({
              label: `Level ${l.seriousnessLevel}`,
              count: l.count,
            }))
          )
        );
      } catch (e: unknown) {
        error(e instanceof Error ? e.message : String(e));
        cmd.error("", { exitCode: 1 });
      }
    });
}
