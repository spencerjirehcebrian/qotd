import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const text = new URL(request.url).searchParams.get('text');
    if (!text) {
      return createErrorResponse('text query parameter is required', 'check_duplicate', undefined, 400);
    }

    const existing = await prisma.question.findFirst({
      where: { text: { contains: text } },
    });

    return createSuccessResponse({
      isDuplicate: existing !== null,
      existingId: existing?.id ?? null,
      existingText: existing?.text ?? null,
    });
  } catch (error) {
    return createErrorResponse(error as Error, 'check_duplicate', undefined, 500);
  }
}
