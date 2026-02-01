import type { Command } from "commander";
import { select, confirm, input, number } from "@inquirer/prompts";
import { ExitPromptError } from "@inquirer/core";
import { createDataClient } from "./lib/data-client";
import { loadConfig, saveConfig, clearConfig, getRemoteConfig } from "./lib/config";
import { info, error, success, warn } from "./lib/output";
import {
  buildGenerateArgs,
  buildListArgs,
  buildEditArgs,
  buildDeleteArgs,
  buildStatsArgs,
} from "./lib/interactive-args";

export async function runInteractiveMode(program: Command) {
  try {
    if (!process.stdin.isTTY) {
      error(
        "Interactive mode requires a terminal. Use --help for command usage."
      );
      process.exit(1);
    }

    const command = await select({
      message: "What would you like to do?",
      choices: [
        { name: "Generate questions", value: "generate" },
        { name: "List questions", value: "list" },
        { name: "Edit a question", value: "edit" },
        { name: "Delete questions", value: "delete" },
        { name: "View statistics", value: "stats" },
        { name: "Configure remote", value: "configure" },
      ],
    });

    switch (command) {
      case "generate":
        await promptAndRunGenerate(program);
        break;
      case "list":
        await promptAndRunList(program);
        break;
      case "edit":
        await promptAndRunEdit(program);
        break;
      case "delete":
        await promptAndRunDelete(program);
        break;
      case "stats":
        await promptAndRunStats(program);
        break;
      case "configure":
        await promptAndRunConfigure();
        await runInteractiveMode(program);
        break;
    }
  } catch (e: unknown) {
    if (e instanceof ExitPromptError) {
      console.log();
      process.exit(0);
    }
    throw e;
  }
}

async function fetchCategoryChoices() {
  const client = createDataClient();
  const categories = await client.listCategories();
  return categories.map((c) => ({ name: c.name, value: c.name }));
}

const levelChoices = [
  { name: "Any level", value: 0 },
  ...[1, 2, 3, 4, 5].map((n) => ({ name: `Level ${n}`, value: n })),
];

const levelFilterChoices = [
  { name: "No filter", value: 0 },
  ...[1, 2, 3, 4, 5].map((n) => ({ name: `Level ${n}`, value: n })),
];

const levelEditChoices = [
  { name: "No change", value: 0 },
  ...[1, 2, 3, 4, 5].map((n) => ({ name: `Level ${n}`, value: n })),
];

async function promptAndRunGenerate(program: Command) {
  const count = await number({
    message: "How many questions?",
    default: 5,
    min: 1,
  });

  const categoryChoices = await fetchCategoryChoices();
  const category = await select({
    message: "Category:",
    choices: [{ name: "Any category", value: "" }, ...categoryChoices],
  });

  const level = await select({
    message: "Seriousness level:",
    choices: levelChoices,
  });

  const dryRun = await confirm({
    message: "Dry run (preview only)?",
    default: false,
  });

  const args = buildGenerateArgs({ count: count ?? 5, category, level, dryRun });
  program.parse(args);
}

async function promptAndRunList(program: Command) {
  const categoryChoices = await fetchCategoryChoices();
  const category = await select({
    message: "Filter by category:",
    choices: [{ name: "No filter", value: "" }, ...categoryChoices],
  });

  const level = await select({
    message: "Filter by level:",
    choices: levelFilterChoices,
  });

  const search = await input({
    message: "Search text (leave empty to skip):",
    default: "",
  });

  const args = buildListArgs({ category, level, search });
  program.parse(args);
}

async function promptAndRunEdit(program: Command) {
  const id = await number({
    message: "Question ID to edit:",
    min: 1,
  });

  if (!id || id < 1) {
    error("Invalid question ID.");
    return;
  }

  const text = await input({
    message: "New question text (leave empty to skip):",
    default: "",
  });

  const level = await select({
    message: "New seriousness level:",
    choices: levelEditChoices,
  });

  const categories = await input({
    message: "New category IDs, comma-separated (leave empty to skip):",
    default: "",
  });

  if (!text && !level && !categories) {
    info("Nothing to update.");
    return;
  }

  const args = buildEditArgs({ id, text, level, categories });
  program.parse(args);
}

async function promptAndRunDelete(program: Command) {
  const mode = await select({
    message: "Delete how?",
    choices: [
      { name: "By specific ID(s)", value: "by-id" as const },
      { name: "Delete ALL questions", value: "all" as const },
    ],
  });

  if (mode === "by-id") {
    const idsRaw = await input({
      message: "Question ID(s), space-separated:",
    });
    const ids = idsRaw.trim().split(/\s+/).filter(Boolean);
    if (ids.length === 0) {
      error("No IDs provided.");
      return;
    }
    program.parse(buildDeleteArgs({ mode: "by-id", ids }));
  } else {
    program.parse(buildDeleteArgs({ mode: "all", ids: [] }));
  }
}

async function promptAndRunStats(program: Command) {
  program.parse(buildStatsArgs());
}

async function promptAndRunConfigure() {
  const remote = getRemoteConfig();
  if (remote) {
    info(`Currently connected to: ${remote.apiUrl}`);
  } else {
    info("Currently using local database (Prisma direct).");
  }
  console.log();

  const action = await select({
    message: "Remote configuration:",
    choices: [
      { name: "Set remote server", value: "set" },
      { name: "Switch to local mode", value: "local" },
      { name: "Back", value: "back" },
    ],
  });

  if (action === "back") return;

  if (action === "local") {
    clearConfig();
    success("Switched to local mode. CLI will use Prisma directly.");
    return;
  }

  const config = loadConfig();
  const apiUrl = await input({
    message: "API URL:",
    default: config.apiUrl || "http://localhost:3000",
  });

  const apiKey = await input({
    message: "API Key:",
    default: config.apiKey || "",
  });

  if (!apiUrl || !apiKey) {
    error("Both API URL and API Key are required.");
    return;
  }

  // Test connectivity
  info("Testing connection...");
  try {
    const testUrl = `${apiUrl.replace(/\/$/, "")}/api/categories`;
    const res = await fetch(testUrl, {
      headers: { "x-api-key": apiKey },
    });

    if (!res.ok) {
      warn(`Server responded with ${res.status}. Config saved anyway.`);
    } else {
      success("Connection successful.");
    }
  } catch (e) {
    warn(`Could not connect to ${apiUrl}: ${e instanceof Error ? e.message : String(e)}. Config saved anyway.`);
  }

  saveConfig({ apiUrl, apiKey });
  success(`Remote config saved. CLI will use ${apiUrl}.`);
}
