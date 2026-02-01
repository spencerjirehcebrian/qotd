import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const total = await prisma.question.count();

    const byLevelRaw = await prisma.question.groupBy({
      by: ['seriousnessLevel'],
      _count: { _all: true },
      orderBy: { seriousnessLevel: 'asc' },
    });

    const byLevel = byLevelRaw.map(l => ({
      seriousnessLevel: l.seriousnessLevel,
      count: l._count._all,
    }));

    const categoriesRaw = await prisma.category.findMany({
      include: { _count: { select: { questionCategories: true } } },
      orderBy: { name: 'asc' },
    });

    const byCategory = categoriesRaw.map(c => ({
      name: c.name,
      color: c.color,
      count: c._count.questionCategories,
    }));

    return createSuccessResponse({ total, byLevel, byCategory });
  } catch (error) {
    return createErrorResponse(error as Error, 'get_stats', undefined, 500);
  }
}
