import type { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import { ExitPromptError } from "@inquirer/core";
import { createDataClient } from "../lib/data-client";
import { success, error, warn, info } from "../lib/output";

export function registerDeleteCommand(program: Command) {
  const cmd = program
    .command("delete")
    .description("Delete one or more questions by ID")
    .argument("[ids...]", "Question ID(s) to delete")
    .option("-a, --all", "Delete ALL questions (with confirmation)")
    .option("-y, --yes", "Skip confirmation prompts")
    .action(async (ids: string[], options: { all?: boolean; yes?: boolean }) => {
      try {
        const client = createDataClient();

        if (options.all) {
          const count = await client.getQuestionCount();
          if (count === 0) {
            info("No questions to delete.");
            return;
          }

          if (!options.yes) {
            const confirmed = await confirm({
              message: `Delete ALL ${count} question(s)? This cannot be undone.`,
              default: false,
            });

            if (!confirmed) {
              info("Cancelled.");
              return;
            }
          }

          const deleted = await client.deleteQuestions();
          success(`Deleted ${deleted} question(s)`);
          return;
        }

        if (!ids || ids.length === 0) {
          cmd.error("Provide question ID(s) or use --all", { exitCode: 1 });
        }

        const numericIds = ids.map(Number);
        if (numericIds.some(isNaN)) {
          cmd.error("All IDs must be valid numbers", { exitCode: 1 });
        }

        // Check which IDs exist by trying to get each one
        const existingIds: number[] = [];
        const missingIds: number[] = [];
        for (const id of numericIds) {
          const q = await client.getQuestion(id);
          if (q) {
            existingIds.push(id);
          } else {
            missingIds.push(id);
          }
        }

        if (missingIds.length > 0) {
          warn("Question(s) not found: " + missingIds.join(", "));
        }

        if (existingIds.length === 0) {
          cmd.error("No matching questions found", { exitCode: 1 });
        }

        const deleted = await client.deleteQuestions(existingIds);
        success("Deleted " + deleted + " question(s)");
      } catch (e: unknown) {
        if (e instanceof ExitPromptError) {
          process.exit(0);
        }
        const message = e instanceof Error ? e.message : String(e);
        error(message);
        process.exit(1);
      }
    });
}
