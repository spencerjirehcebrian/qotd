import { Command } from "commander";
import { registerListCommand } from "./commands/list";
import { registerEditCommand } from "./commands/edit";
import { registerDeleteCommand } from "./commands/delete";
import { registerStatsCommand } from "./commands/stats";
import { registerGenerateCommand } from "./commands/generate";
import { runInteractiveMode } from "./interactive";

const program = new Command();

program
  .name("qotd")
  .description("QOTD Question Management CLI")
  .version("0.1.0");

registerListCommand(program);
registerEditCommand(program);
registerDeleteCommand(program);
registerStatsCommand(program);
registerGenerateCommand(program);

const userArgs = process.argv.slice(2);
if (userArgs.length === 0 && process.stdin.isTTY) {
  (async () => {
    await runInteractiveMode(program);
  })();
} else {
  program.parse();
}
