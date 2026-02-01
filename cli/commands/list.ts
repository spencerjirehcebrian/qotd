import type { Command } from "commander";
import { createDataClient } from "../lib/data-client";
import { formatQuestionsTable } from "../lib/format";
import { info, error } from "../lib/output";

export function registerListCommand(program: Command) {
  const cmd = program
    .command("list")
    .description("List questions with optional filters")
    .option("-c, --category <name>", "Filter by category name")
    .option("-l, --level <number>", "Filter by seriousness level (1-5)", parseInt)
    .option("-s, --search <text>", "Search question text")
    .action(async (options) => {
      try {
        const client = createDataClient();
        const questions = await client.listQuestions({
          category: options.category,
          seriousnessLevel: options.level,
          search: options.search,
        });

        if (questions.length === 0) {
          info("No questions found.");
          return;
        }

        const mapped = questions.map((q) => ({
          id: q.id,
          text: q.text,
          seriousnessLevel: q.seriousnessLevel,
          categories: q.categories.map((c) => c.name),
        }));

        console.log(formatQuestionsTable(mapped));
        info(`Total: ${questions.length} question(s)`);
      } catch (e: unknown) {
        error(e instanceof Error ? e.message : String(e));
        cmd.error("", { exitCode: 1 });
      }
    });
}
