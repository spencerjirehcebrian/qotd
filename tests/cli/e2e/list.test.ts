import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, seedTestDb } from "../helpers/setup";
import { runCli } from "../helpers/run-cli";
import type { PrismaClient } from "@prisma/client";

describe("CLI list command", () => {
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

  it("lists all questions", async () => {
    const { stdout, exitCode } = await runCli(["list"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("desert island");
    expect(stdout).toContain("10 question(s)");
  });

  it("filters by category", async () => {
    const { stdout, exitCode } = await runCli(["list", "-c", "Hot Takes"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("unpopular opinion");
    // Should not contain questions from other categories only
    expect(stdout).not.toContain("10 question(s)");
  });

  it("filters by level", async () => {
    const { stdout, exitCode } = await runCli(["list", "-l", "5"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("2 question(s)");
  });

  it("filters by search text", async () => {
    const { stdout, exitCode } = await runCli(["list", "-s", "desert island"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("desert island");
    expect(stdout).toContain("1 question(s)");
  });

  it("shows message when no matches found", async () => {
    const { stdout, exitCode } = await runCli(["list", "-s", "xyznonexistent"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("No questions found");
  });
});
