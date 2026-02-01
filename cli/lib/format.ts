import Table from "cli-table3";
import pc from "picocolors";

interface QuestionRow {
  id: number;
  text: string;
  seriousnessLevel: number;
  categories: string[];
}

interface StatsRow {
  label: string;
  count: number;
}

export function formatQuestionsTable(questions: QuestionRow[]): string {
  const table = new Table({
    head: [pc.cyan("ID"), pc.cyan("Question"), pc.cyan("Level"), pc.cyan("Categories")],
    colWidths: [8, 50, 8, 25],
    wordWrap: true,
  });

  for (const q of questions) {
    table.push([String(q.id), q.text, String(q.seriousnessLevel), q.categories.join(", ")]);
  }

  return table.toString();
}

export function formatStatsTable(rows: StatsRow[]): string {
  const table = new Table({
    head: [pc.cyan("Category"), pc.cyan("Count")],
    colWidths: [30, 10],
  });

  for (const row of rows) {
    table.push([row.label, String(row.count)]);
  }

  return table.toString();
}

interface SummaryEntry {
  categories: string[];
  seriousnessLevel: number;
}

export function formatSummaryTable(entries: SummaryEntry[]): string {
  // Collect unique categories sorted alphabetically
  const categorySet = new Set<string>();
  for (const entry of entries) {
    for (const cat of entry.categories) {
      categorySet.add(cat);
    }
  }
  const categories = Array.from(categorySet).sort();

  const levels = [1, 2, 3, 4, 5];

  const table = new Table({
    head: [
      pc.cyan("Category"),
      ...levels.map((l) => pc.cyan(`L${l}`)),
      pc.cyan("Total"),
    ],
  });

  const colTotals = new Array(levels.length).fill(0);

  for (const cat of categories) {
    const row: string[] = [cat];
    let rowTotal = 0;
    for (let i = 0; i < levels.length; i++) {
      const count = entries.filter(
        (e) => e.seriousnessLevel === levels[i] && e.categories.includes(cat)
      ).length;
      colTotals[i] += count;
      rowTotal += count;
      row.push(count === 0 ? pc.dim("0") : pc.bold(String(count)));
    }
    row.push(pc.bold(String(rowTotal)));
    table.push(row);
  }

  // Totals row
  const totalRow: string[] = [pc.bold("Total")];
  let grandTotal = 0;
  for (let i = 0; i < levels.length; i++) {
    grandTotal += colTotals[i];
    totalRow.push(
      colTotals[i] === 0
        ? pc.dim("0")
        : pc.bold(String(colTotals[i]))
    );
  }
  totalRow.push(pc.bold(String(grandTotal)));
  table.push(totalRow);

  return table.toString();
}
