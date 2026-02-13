import { Command } from "commander";
import { registerListCommand } from "./commands/list";
import { registerEditCommand } from "./commands/edit";
import { registerDeleteCommand } from "./commands/delete";
import { registerStatsCommand } from "./commands/stats";
import { registerGenerateCommand } from "./commands/generate";
import { runInteractiveMode } from "./interactive";
import { setModeOverride, ensureRemoteConfig } from "./lib/data-client";
import { error } from "./lib/output";

const program = new Command();

program
  .name("qotd")
  .description("QOTD Question Management CLI")
  .version("0.1.0")
  .option("--local", "Force local mode (direct Prisma/SQLite)")
  .option("--remote", "Force remote mode (HTTP API)");

registerListCommand(program);
registerEditCommand(program);
registerDeleteCommand(program);
registerStatsCommand(program);
registerGenerateCommand(program);

async function resolveMode(): Promise<"local" | "remote" | null> {
  const opts = program.opts();
  if (opts.local && opts.remote) {
    error("Cannot use --local and --remote together.");
    process.exit(1);
  }
  if (opts.local) return "local";
  if (opts.remote) return "remote";
  return null;
}

const userArgs = process.argv.slice(2);

// Check for global flags to determine if we're in interactive mode
// Interactive mode: no subcommand args (only global flags like --local/--remote)
const nonFlagArgs = userArgs.filter((a) => a !== "--local" && a !== "--remote");
const isInteractive = nonFlagArgs.length === 0 && process.stdin.isTTY;

if (isInteractive) {
  // Resolve mode directly from argv instead of Commander (which prints help on empty args)
  const hasLocal = userArgs.includes("--local");
  const hasRemote = userArgs.includes("--remote");
  (async () => {
    if (hasLocal && hasRemote) {
      error("Cannot use --local and --remote together.");
      process.exit(1);
    }
    const mode = hasLocal ? "local" : hasRemote ? "remote" : null;
    setModeOverride(mode);
    if (mode === "remote") await ensureRemoteConfig();
    await runInteractiveMode(program);
  })();
} else {
  // Hook into Commander's action handling to set mode before commands run
  program.hook("preAction", async () => {
    const mode = await resolveMode();
    setModeOverride(mode);
    if (mode === "remote") await ensureRemoteConfig();
  });
  program.parse();
}
