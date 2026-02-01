import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/errorHandler';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return createErrorResponse('questions must be a non-empty array', 'bulk_create', undefined, 400);
    }

    const created: unknown[] = [];
    const errors: { index: number; text: string; error: string }[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        if (!q.text || !q.seriousnessLevel || !Array.isArray(q.categoryNames) || q.categoryNames.length === 0) {
          errors.push({ index: i, text: q.text || '', error: 'Missing required fields (text, seriousnessLevel, categoryNames)' });
          continue;
        }

        const validCategories = await prisma.category.findMany({
          where: { name: { in: q.categoryNames } },
        });
        const validNames = new Set(validCategories.map((c: { name: string }) => c.name));
        const invalidNames = q.categoryNames.filter((n: string) => !validNames.has(n));

        if (invalidNames.length > 0) {
          errors.push({ index: i, text: q.text, error: `Invalid categories: ${invalidNames.join(', ')}` });
          continue;
        }

        const question = await prisma.question.create({
          data: {
            text: q.text,
            textNorm: q.textNorm || undefined,
            seriousnessLevel: q.seriousnessLevel,
            questionCategories: {
              create: q.categoryNames.map((name: string) => ({
                category: { connect: { name } },
              })),
            },
          },
          include: { questionCategories: { include: { category: true } } },
        });

        created.push({
          ...question,
          categories: question.questionCategories.map((qc: { category: unknown }) => qc.category),
        });
      } catch (err) {
        errors.push({ index: i, text: q.text || '', error: err instanceof Error ? err.message : String(err) });
      }
    }

    return createSuccessResponse({ created, errors }, 'Bulk create completed');
  } catch (error) {
    return createErrorResponse(error as Error, 'bulk_create', undefined, 500);
  }
}
