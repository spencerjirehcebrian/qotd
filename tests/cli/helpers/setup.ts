import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

interface TestDb {
  url: string;
  filePath: string;
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qotd-test-"));
  const filePath = path.join(tmpDir, "test.db");
  const url = `file:${filePath}`;

  const projectRoot = path.resolve(__dirname, "../../..");

  execSync(`npx prisma migrate deploy`, {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  const cleanup = async () => {
    await prisma.$disconnect();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  };

  return { url, filePath, prisma, cleanup };
}

interface SeedResult {
  totalQuestions: number;
  totalCategories: number;
  categoryIds: Record<string, number>;
}

export async function seedTestDb(prisma: PrismaClient): Promise<SeedResult> {
  const categoryData = [
    { name: "Preferences", color: "#FF6B6B" },
    { name: "Just for Fun", color: "#4ECDC4" },
    { name: "Backstory", color: "#45B7D1" },
    { name: "What If", color: "#96CEB4" },
    { name: "Hot Takes", color: "#FFEAA7" },
    { name: "Real Talk", color: "#DDA0DD" },
    { name: "Wildcard", color: "#98D8C8" },
  ];

  const categoryIds: Record<string, number> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.create({ data: cat });
    categoryIds[cat.name] = created.id;
  }

  const questions = [
    // Level 1 (2 questions)
    { text: "If you were stranded on a desert island, what three items would you bring?", level: 1, cats: ["Preferences"] },
    { text: "What is the most useless talent you have?", level: 1, cats: ["Just for Fun"] },
    // Level 2 (2 questions)
    { text: "What is an unpopular opinion you hold strongly?", level: 2, cats: ["Hot Takes"] },
    { text: "What childhood hobby do you wish you never gave up?", level: 2, cats: ["Backstory"] },
    // Level 3 (2 questions)
    { text: "If you could have dinner with any historical figure, who would it be?", level: 3, cats: ["What If"] },
    { text: "What is a small act of kindness you will never forget?", level: 3, cats: ["Real Talk"] },
    // Level 4 (2 questions) -- question 7 has multiple categories
    { text: "What life experience shaped who you are the most?", level: 4, cats: ["Backstory", "Real Talk"] },
    { text: "What would you do differently if you could relive your twenties?", level: 4, cats: ["Backstory"] },
    // Level 5 (2 questions) -- question 10 has multiple categories
    { text: "What is the hardest truth you have had to accept?", level: 5, cats: ["Real Talk"] },
    { text: "If you could change one decision in your life, what would it be and why?", level: 5, cats: ["Preferences", "Real Talk"] },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        text: q.text,
        seriousnessLevel: q.level,
        questionCategories: {
          create: q.cats.map((catName) => ({
            categoryId: categoryIds[catName],
          })),
        },
      },
    });
  }

  return {
    totalQuestions: questions.length,
    totalCategories: categoryData.length,
    categoryIds,
  };
}
