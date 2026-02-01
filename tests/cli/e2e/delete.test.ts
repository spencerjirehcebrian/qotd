import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createTestDb, seedTestDb } from "../helpers/setup";
import { runCli } from "../helpers/run-cli";
import type { PrismaClient } from "@prisma/client";

describe("CLI delete command", () => {
  let dbUrl: string;
  let prisma: PrismaClient;
  let cleanup: () => Promise<void>;

  // Fresh DB per test since delete is destructive
  beforeEach(async () => {
    if (cleanup) await cleanup();
    const db = await createTestDb();
    dbUrl = db.url;
    prisma = db.prisma;
    cleanup = db.cleanup;
    await seedTestDb(prisma);
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  it("deletes by IDs with --yes", async () => {
    const { stdout, exitCode } = await runCli(["delete", "1", "2", "--yes"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Deleted 2 question(s)");

    const count = await prisma.question.count();
    expect(count).toBe(8);
  });

  it("deletes all with --all --yes", async () => {
    const { stdout, exitCode } = await runCli(["delete", "--all", "--yes"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Deleted 10 question(s)");

    const count = await prisma.question.count();
    expect(count).toBe(0);
  });

  it("warns on non-existent ID but deletes valid ones", async () => {
    const { stdout, exitCode } = await runCli(["delete", "1", "9999", "--yes"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("not found: 9999");
    expect(stdout).toContain("Deleted 1 question(s)");
  });

  it("errors when no IDs and no --all", async () => {
    const { exitCode, stderr } = await runCli(["delete", "--yes"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("Provide question ID(s) or use --all");
  });
});
