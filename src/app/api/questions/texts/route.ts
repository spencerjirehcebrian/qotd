import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const questions = await prisma.question.findMany({
      select: { text: true },
    });

    return createSuccessResponse({ texts: questions.map(q => q.text) });
  } catch (error) {
    return createErrorResponse(error as Error, 'get_texts', undefined, 500);
  }
}
