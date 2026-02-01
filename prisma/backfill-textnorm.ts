import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const questions = await prisma.question.findMany({
    where: { textNorm: null },
    select: { id: true, text: true },
  });

  console.log(`Found ${questions.length} question(s) without textNorm`);

  const seen = new Map<string, number>();
  let updated = 0;
  let collisions = 0;

  for (const q of questions) {
    const norm = normalizeText(q.text);

    if (seen.has(norm)) {
      console.warn(
        `WARNING: Collision -- question ${q.id} normalizes to same value as question ${seen.get(norm)}: "${norm}"`
      );
      collisions++;
      continue;
    }

    try {
      await prisma.question.update({
        where: { id: q.id },
        data: { textNorm: norm },
      });
      seen.set(norm, q.id);
      updated++;
    } catch (err) {
      console.error(
        `ERROR: Failed to update question ${q.id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  console.log(`Updated: ${updated}, Collisions skipped: ${collisions}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
