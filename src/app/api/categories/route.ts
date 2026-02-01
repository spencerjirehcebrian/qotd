import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleQOTDError,
  createErrorResponse,
  createSuccessResponse,
  ErrorSeverity
} from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const withCount = new URL(request.url).searchParams.get('withCount') === 'true';

    if (withCount) {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { questionCategories: true } } },
      });
      const mapped = categories.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        createdAt: c.createdAt,
        questionCount: c._count.questionCategories,
      }));
      return createSuccessResponse({ categories: mapped }, 'Categories fetched successfully');
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return createSuccessResponse({ categories }, 'Categories fetched successfully');
  } catch (error) {
    const errorReport = handleQOTDError(
      error as Error,
      'fetch_categories',
      {
        operation: 'fetch_categories',
        responseTimeMs: Date.now() - startTime
      },
      ErrorSeverity.HIGH
    );
    
    return createErrorResponse(
      error as Error,
      'fetch_categories',
      errorReport.context,
      500
    );
  }
}