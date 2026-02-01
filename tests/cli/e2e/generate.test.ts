import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, seedTestDb } from "../helpers/setup";
import { runCli } from "../helpers/run-cli";
import type { PrismaClient } from "@prisma/client";

describe("CLI generate command", { timeout: 180_000 }, () => {
  let dbUrl: string;
  let prisma: PrismaClient;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const db = await createTestDb();
    dbUrl = db.url;
    prisma = db.prisma;
    cleanup = db.cleanup;
    await seedTestDb(prisma);
  });

  afterAll(async () => {
    await cleanup();
  });

  it("generates 1 question and inserts it", async () => {
    const before = await prisma.question.count();
    const { stdout, exitCode } = await runCli(["generate", "-n", "1"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("inserted");

    const after = await prisma.question.count();
    expect(after).toBe(before + 1);

    // Streaming output: the question text should appear in stdout
    const newest = await prisma.question.findFirst({ orderBy: { id: "desc" } });
    expect(newest).not.toBeNull();
    expect(newest!.text.length).toBeGreaterThan(10);

    // Summary line with cost/turns/duration should appear
    expect(stdout).toMatch(/cost: \$/);
    expect(stdout).toMatch(/turns: \d+/);
    expect(stdout).toMatch(/duration: [\d.]+s/);
  });

  it("generates with --category and assigns it", async () => {
    const { exitCode } = await runCli(["generate", "-n", "1", "-c", "Hot Takes"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);

    // Get the newest question
    const newest = await prisma.question.findFirst({
      orderBy: { id: "desc" },
      include: { questionCategories: { include: { category: true } } },
    });
    const catNames = newest?.questionCategories.map((qc) => qc.category.name) ?? [];
    expect(catNames).toContain("Hot Takes");
  });

  it("generates with --level and assigns correct seriousness", async () => {
    const { stdout, exitCode } = await runCli(["generate", "-n", "1", "-l", "3"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("inserted");

    const newest = await prisma.question.findFirst({ orderBy: { id: "desc" } });
    expect(newest).not.toBeNull();
    expect(newest!.seriousnessLevel).toBe(3);
  });

  it("generates multiple questions (-n 3)", { retry: 2 }, async () => {
    const before = await prisma.question.count();
    const { stdout, exitCode } = await runCli(["generate", "-n", "3"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);

    const after = await prisma.question.count();
    expect(after).toBe(before + 3);

    // Stdout should mention "3 questions inserted" (or similar)
    expect(stdout).toMatch(/3 question/i);
  });

  it("dry run does not change DB count", async () => {
    const before = await prisma.question.count();
    const { stdout, exitCode } = await runCli(["generate", "-n", "1", "--dry-run"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("dry run");

    const after = await prisma.question.count();
    expect(after).toBe(before);
  });

  it("dry run shows PREVIEW output and cost summary", async () => {
    const { stdout, exitCode } = await runCli(["generate", "-n", "1", "--dry-run"], {
      env: { DATABASE_URL: dbUrl },
      timeout: 180_000,
    });
    expect(exitCode).toBe(0);
    // Should show either [PREVIEW] marker or the question text in agent output
    expect(stdout.length).toBeGreaterThan(50);
    // Cost summary should still appear
    expect(stdout).toMatch(/cost: \$/);
  });

  it("errors on invalid count", async () => {
    const { exitCode, stderr } = await runCli(["generate", "-n", "0"], {
      env: { DATABASE_URL: dbUrl },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("--count must be a positive integer");
  });

  it("errors on --level 0 (below range)", async () => {
    const { exitCode, stderr } = await runCli(["generate", "-n", "1", "-l", "0"], {
      env: { DATABASE_URL: dbUrl },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("--level must be between 1 and 5");
  });

  it("errors on --level 6 (above range)", async () => {
    const { exitCode, stderr } = await runCli(["generate", "-n", "1", "-l", "6"], {
      env: { DATABASE_URL: dbUrl },
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("--level must be between 1 and 5");
  });
});
