import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestDb, seedTestDb } from "../helpers/setup";
import { runCli } from "../helpers/run-cli";
import type { PrismaClient } from "@prisma/client";

describe("CLI stats command", () => {
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

  it("shows total question count", async () => {
    const { stdout, exitCode } = await runCli(["stats"], { env: { DATABASE_URL: dbUrl } });
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Total questions: 10");
  });

  it("shows category names", async () => {
    const { stdout } = await runCli(["stats"], { env: { DATABASE_URL: dbUrl } });
    expect(stdout).toContain("Preferences");
    expect(stdout).toContain("Hot Takes");
    expect(stdout).toContain("Real Talk");
    expect(stdout).toContain("Wildcard");
  });

  it("shows level labels", async () => {
    const { stdout } = await runCli(["stats"], { env: { DATABASE_URL: dbUrl } });
    expect(stdout).toContain("Level 1");
    expect(stdout).toContain("Level 5");
  });
});
