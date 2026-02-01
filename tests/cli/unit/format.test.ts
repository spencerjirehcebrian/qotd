import { describe, it, expect } from "vitest";
import { formatQuestionsTable, formatStatsTable, formatSummaryTable } from "../../../cli/lib/format";

describe("formatQuestionsTable", () => {
  it("formats a single question", () => {
    const result = formatQuestionsTable([
      { id: 1, text: "What is your name?", seriousnessLevel: 2, categories: ["Backstory"] },
    ]);
    expect(result).toContain("1");
    expect(result).toContain("What is your name?");
    expect(result).toContain("2");
    expect(result).toContain("Backstory");
  });

  it("formats multiple questions", () => {
    const result = formatQuestionsTable([
      { id: 1, text: "Question A", seriousnessLevel: 1, categories: ["Hot Takes"] },
      { id: 2, text: "Question B", seriousnessLevel: 5, categories: ["Real Talk", "Backstory"] },
    ]);
    expect(result).toContain("Question A");
    expect(result).toContain("Question B");
    expect(result).toContain("Real Talk, Backstory");
  });

  it("handles empty array", () => {
    const result = formatQuestionsTable([]);
    expect(typeof result).toBe("string");
  });
});

describe("formatStatsTable", () => {
  it("formats stats rows", () => {
    const result = formatStatsTable([
      { label: "Hot Takes", count: 5 },
      { label: "Real Talk", count: 3 },
    ]);
    expect(result).toContain("Hot Takes");
    expect(result).toContain("5");
    expect(result).toContain("Real Talk");
    expect(result).toContain("3");
  });

  it("handles empty array", () => {
    const result = formatStatsTable([]);
    expect(typeof result).toBe("string");
  });
});

describe("formatSummaryTable", () => {
  it("formats summary entries", () => {
    const result = formatSummaryTable([
      { categories: ["Hot Takes"], seriousnessLevel: 3 },
      { categories: ["Hot Takes"], seriousnessLevel: 4 },
      { categories: ["Real Talk"], seriousnessLevel: 3 },
    ]);
    expect(result).toContain("Hot Takes");
    expect(result).toContain("Real Talk");
    expect(result).toContain("Total");
  });

  it("handles multi-category entries", () => {
    const result = formatSummaryTable([
      { categories: ["Hot Takes", "Real Talk"], seriousnessLevel: 2 },
    ]);
    expect(result).toContain("Hot Takes");
    expect(result).toContain("Real Talk");
  });

  it("handles empty array", () => {
    const result = formatSummaryTable([]);
    expect(typeof result).toBe("string");
  });
});
