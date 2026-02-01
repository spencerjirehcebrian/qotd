import type { Command } from "commander";
import { createSpinner } from "nanospinner";
import { runQotdAgent } from "../lib/agent";
import type { ProgressEvent } from "../lib/agent";
import { formatSummaryTable } from "../lib/format";
import { info, error, success, warn } from "../lib/output";
import pc from "picocolors";

function buildGeneratePrompt({
  count,
  category,
  level,
}: {
  count: number;
  category?: string;
  level?: number;
}): string {
  const parts: string[] = [];

  parts.push(`Generate exactly ${count} new QOTD questions.`);
  parts.push(
    "Always call list_categories first to confirm the exact category names before proposing any questions."
  );

  if (category) {
    parts.push(
      `All questions must be in the "${category}" category. Use the exact category name as returned by list_categories.`
    );
  }

  if (level) {
    parts.push(`All questions must be at seriousness level ${level}.`);
  }

  parts.push(
    "After generating all questions, call propose_questions ONCE with the full array."
  );

  return parts.join("\n");
}

export function registerGenerateCommand(program: Command) {
  const cmd = program
    .command("generate")
    .description("Generate QOTD questions using Claude AI")
    .option("-n, --count <n>", "Number of questions to generate", "5")
    .option("-c, --category <name>", "Target category")
    .option("-l, --level <n>", "Target seriousness level (1-5)")
    .option("--dry-run", "Preview without inserting", false)
    .action(async (options) => {
      try {
        const count = parseInt(options.count, 10);
        if (isNaN(count) || count < 1) {
          cmd.error("--count must be a positive integer", { exitCode: 1 });
        }

        const level = options.level
          ? parseInt(options.level, 10)
          : undefined;
        if (level !== undefined && (isNaN(level) || level < 1 || level > 5)) {
          cmd.error("--level must be between 1 and 5", { exitCode: 1 });
        }

        const category: string | undefined = options.category;
        const dryRun: boolean = options.dryRun;

        const prompt = buildGeneratePrompt({ count, category, level });

        if (dryRun) {
          warn("DRY RUN -- questions will be previewed but not inserted");
        }

        info("Starting Claude agent...");

        const results: { text: string; seriousnessLevel: number; categories: string[] }[] = [];
        let errorCount = 0;
        let rejectedCount = 0;
        const isTTY = process.stdout.isTTY;
        const spinner = isTTY ? createSpinner("Generating questions...").start() : null;

        const onProgress = (event: ProgressEvent) => {
          const counter = event.total > 0 ? `${event.index}/${event.total}` : "";

          switch (event.type) {
            case "batch_received":
              if (spinner) spinner.update({ text: "Checking duplicates..." });
              break;

            case "question_accepted":
              if (spinner) spinner.stop();
              console.log(
                `${pc.dim(counter)} ${pc.green("ACCEPTED")} ${event.text}`
              );
              if (!dryRun && spinner) spinner.start({ text: "Inserting questions..." });
              break;

            case "question_rejected":
              if (spinner) spinner.stop();
              console.log(
                `${pc.dim("  ")} ${pc.yellow("REJECTED")} ${event.text} ${pc.dim(`-- ${event.reason}`)}`
              );
              rejectedCount++;
              if (spinner) spinner.start({ text: "Checking duplicates..." });
              break;

            case "question_created":
              if (spinner) spinner.stop();
              console.log(
                `${pc.dim(counter)} ${pc.green("INSERTED")} ${event.text}`
              );
              results.push({
                text: event.text,
                seriousnessLevel: event.seriousnessLevel ?? 0,
                categories: Array.isArray(event.categories)
                  ? event.categories.map((c: string | { name: string }) => typeof c === "string" ? c : c.name)
                  : [],
              });
              if (spinner) spinner.start({ text: "Inserting questions..." });
              break;

            case "question_error":
              if (spinner) spinner.stop();
              console.log(
                `${pc.dim(counter)} ${pc.red("ERROR")} ${event.error}`
              );
              errorCount++;
              if (spinner) spinner.start({ text: "Inserting questions..." });
              break;

            case "retry":
              if (spinner) spinner.stop();
              console.log(
                `\n${pc.cyan("RETRY")} ${event.text}`
              );
              if (spinner) spinner.start({ text: "Retrying generation..." });
              break;
          }
        };

        let result;
        try {
          result = await runQotdAgent(prompt, {
            dryRun,
            onProgress,
            requestedCount: count,
          });
        } finally {
          if (spinner) spinner.stop();
        }

        console.log();
        if (dryRun) {
          // In dry-run, accepted questions are not inserted -- show summary from events
          // Re-count from progress events: results will be empty since no inserts happened
          const acceptedCount = count - rejectedCount - errorCount;
          success(
            `Done (dry run) -- ${acceptedCount} accepted, ${rejectedCount} rejected`
          );
        } else if (errorCount > 0) {
          warn(`${results.length}/${results.length + errorCount} inserted, ${errorCount} failed`);
        } else {
          success(`${results.length} question${results.length !== 1 ? "s" : ""} inserted`);
        }
        if (results.length > 0) {
          console.log();
          console.log(formatSummaryTable(results));
        }
        console.log();
        success(
          `Done -- cost: $${result.cost.toFixed(4)}, turns: ${result.turns}, duration: ${(result.durationMs / 1000).toFixed(1)}s`
        );
      } catch (e: unknown) {
        error(e instanceof Error ? e.message : String(e));
        process.exit(1);
      }
    });
}
