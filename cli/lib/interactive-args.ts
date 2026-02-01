export interface GenerateAnswers {
  count: number;
  category: string;
  level: number;
  dryRun: boolean;
}

export interface ListAnswers {
  category: string;
  level: number;
  search: string;
}

export interface EditAnswers {
  id: number;
  text: string;
  level: number;
  categories: string;
}

export interface DeleteAnswers {
  mode: "by-id" | "all";
  ids: string[];
}

export function buildGenerateArgs(answers: GenerateAnswers): string[] {
  const args = ["node", "qotd", "generate", "-n", String(answers.count)];
  if (answers.category) args.push("-c", answers.category);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.dryRun) args.push("--dry-run");
  return args;
}

export function buildListArgs(answers: ListAnswers): string[] {
  const args = ["node", "qotd", "list"];
  if (answers.category) args.push("-c", answers.category);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.search) args.push("-s", answers.search);
  return args;
}

export function buildEditArgs(answers: EditAnswers): string[] {
  const args = ["node", "qotd", "edit", String(answers.id)];
  if (answers.text) args.push("-t", answers.text);
  if (answers.level) args.push("-l", String(answers.level));
  if (answers.categories) args.push("-c", answers.categories);
  return args;
}

export function buildDeleteArgs(answers: DeleteAnswers): string[] {
  if (answers.mode === "all") {
    return ["node", "qotd", "delete", "--all"];
  }
  return ["node", "qotd", "delete", ...answers.ids];
}

export function buildStatsArgs(): string[] {
  return ["node", "qotd", "stats"];
}
