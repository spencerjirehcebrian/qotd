import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, seedTestDb } from "../helpers/setup";
import { runCli } from "../helpers/run-cli";
import type { PrismaClient } from "@prisma/client";

describe("CLI edit command", () => {
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

  it("edits question text", async () => {
    const { stdout, exitCode } = await runCli(["edit", "1", "-t", "Updated question text"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("updated successfully");

    const q = await prisma.question.findUnique({ where: { id: 1 } });
    expect(q?.text).toBe("Updated question text");
  });

  it("edits question level", async () => {
    const { stdout, exitCode } = await runCli(["edit", "2", "-l", "5"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("updated successfully");

    const q = await prisma.question.findUnique({ where: { id: 2 } });
    expect(q?.seriousnessLevel).toBe(5);
  });

  it("errors on non-existent ID", async () => {
    const { exitCode, stderr } = await runCli(["edit", "9999", "-t", "nope"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).not.toBe(0);
    const combined = stderr;
    expect(combined).toContain("not found");
  });

  it("errors when no options provided", async () => {
    const { exitCode, stderr } = await runCli(["edit", "1"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("Provide at least one option");
  });
});
