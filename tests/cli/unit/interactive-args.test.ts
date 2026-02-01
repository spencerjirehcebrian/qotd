import { describe, it, expect } from "vitest";
import {
  buildGenerateArgs,
  buildListArgs,
  buildEditArgs,
  buildDeleteArgs,
  buildStatsArgs,
} from "../../../cli/lib/interactive-args";

describe("buildGenerateArgs", () => {
  it("returns minimal args with only count", () => {
    const args = buildGenerateArgs({ count: 5, category: "", level: 0, dryRun: false });
    expect(args).toEqual(["node", "qotd", "generate", "-n", "5"]);
  });

  it("includes all options when populated", () => {
    const args = buildGenerateArgs({ count: 3, category: "Hot Takes", level: 4, dryRun: true });
    expect(args).toEqual(["node", "qotd", "generate", "-n", "3", "-c", "Hot Takes", "-l", "4", "--dry-run"]);
  });

  it("omits category when empty string", () => {
    const args = buildGenerateArgs({ count: 1, category: "", level: 2, dryRun: false });
    expect(args).not.toContain("-c");
  });

  it("omits level when zero", () => {
    const args = buildGenerateArgs({ count: 1, category: "Real Talk", level: 0, dryRun: false });
    expect(args).not.toContain("-l");
  });
});

describe("buildListArgs", () => {
  it("returns minimal args with no filters", () => {
    const args = buildListArgs({ category: "", level: 0, search: "" });
    expect(args).toEqual(["node", "qotd", "list"]);
  });

  it("includes all filters when populated", () => {
    const args = buildListArgs({ category: "Backstory", level: 3, search: "childhood" });
    expect(args).toEqual(["node", "qotd", "list", "-c", "Backstory", "-l", "3", "-s", "childhood"]);
  });

  it("omits empty search", () => {
    const args = buildListArgs({ category: "Hot Takes", level: 0, search: "" });
    expect(args).not.toContain("-s");
    expect(args).toContain("-c");
  });
});

describe("buildEditArgs", () => {
  it("returns minimal args with only id", () => {
    const args = buildEditArgs({ id: 42, text: "", level: 0, categories: "" });
    expect(args).toEqual(["node", "qotd", "edit", "42"]);
  });

  it("includes all options when populated", () => {
    const args = buildEditArgs({ id: 1, text: "New text", level: 3, categories: "1,2" });
    expect(args).toEqual(["node", "qotd", "edit", "1", "-t", "New text", "-l", "3", "-c", "1,2"]);
  });

  it("omits text when empty", () => {
    const args = buildEditArgs({ id: 5, text: "", level: 2, categories: "" });
    expect(args).not.toContain("-t");
  });
});

describe("buildDeleteArgs", () => {
  it("returns --all for all mode", () => {
    const args = buildDeleteArgs({ mode: "all", ids: [] });
    expect(args).toEqual(["node", "qotd", "delete", "--all"]);
  });

  it("returns ids for by-id mode", () => {
    const args = buildDeleteArgs({ mode: "by-id", ids: ["1", "2", "3"] });
    expect(args).toEqual(["node", "qotd", "delete", "1", "2", "3"]);
  });
});

describe("buildStatsArgs", () => {
  it("returns stats command", () => {
    expect(buildStatsArgs()).toEqual(["node", "qotd", "stats"]);
  });
});
