import type { Command } from "commander";
import { createDataClient } from "../lib/data-client";
import { success, error } from "../lib/output";

export function registerEditCommand(program: Command) {
  const cmd = program
    .command("edit")
    .description("Edit a question by ID")
    .argument("<id>", "Question ID to edit")
    .option("-t, --text <text>", "New question text")
    .option("-l, --level <number>", "New seriousness level (1-5)", parseInt)
    .option("-c, --categories <ids>", "New category IDs (comma-separated)")
    .action(async (id: string, options: { text?: string; level?: number; categories?: string }) => {
      try {
        const questionId = Number(id);
        if (isNaN(questionId)) {
          cmd.error("Invalid ID", { exitCode: 1 });
        }

        if (!options.text && options.level === undefined && !options.categories) {
          cmd.error("Provide at least one option: --text, --level, or --categories", { exitCode: 1 });
        }

        if (options.level !== undefined) {
          if (isNaN(options.level) || options.level < 1 || options.level > 5) {
            cmd.error("Level must be between 1 and 5", { exitCode: 1 });
          }
        }

        const client = createDataClient();
        const existing = await client.getQuestion(questionId);
        if (!existing) {
          cmd.error("Question " + questionId + " not found", { exitCode: 1 });
        }

        const input: { text?: string; seriousnessLevel?: number; categoryIds?: number[] } = {};

        if (options.text) {
          input.text = options.text;
        }

        if (options.level !== undefined) {
          input.seriousnessLevel = options.level;
        }

        if (options.categories) {
          const catIds = options.categories.split(",").map(Number);
          if (catIds.some(isNaN)) {
            cmd.error("Category IDs must be valid numbers", { exitCode: 1 });
          }
          input.categoryIds = catIds;
        }

        await client.updateQuestion(questionId, input);
        success("Question " + questionId + " updated successfully");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        error(message);
        process.exit(1);
      }
    });
}
