import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/errorHandler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return createErrorResponse('Invalid ID', 'get_question', undefined, 400);
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { questionCategories: { include: { category: true } } },
    });

    if (!question) {
      return createErrorResponse('Question not found', 'get_question', undefined, 404);
    }

    const transformed = {
      ...question,
      categories: question.questionCategories.map(qc => qc.category),
    };

    return createSuccessResponse({ question: transformed });
  } catch (error) {
    return createErrorResponse(error as Error, 'get_question', undefined, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return createErrorResponse('Invalid ID', 'update_question', undefined, 400);
    }

    const existing = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) {
      return createErrorResponse('Question not found', 'update_question', undefined, 404);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.text === 'string') data.text = body.text;
    if (typeof body.seriousnessLevel === 'number') data.seriousnessLevel = body.seriousnessLevel;

    if (Array.isArray(body.categoryIds)) {
      data.questionCategories = {
        deleteMany: {},
        createMany: { data: body.categoryIds.map((cid: number) => ({ categoryId: cid })) },
      };
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data,
      include: { questionCategories: { include: { category: true } } },
    });

    const transformed = {
      ...question,
      categories: question.questionCategories.map(qc => qc.category),
    };

    return createSuccessResponse({ question: transformed }, 'Question updated successfully');
  } catch (error) {
    return createErrorResponse(error as Error, 'update_question', undefined, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return createErrorResponse('Invalid ID', 'delete_question', undefined, 400);
    }

    const existing = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) {
      return createErrorResponse('Question not found', 'delete_question', undefined, 404);
    }

    await prisma.question.delete({ where: { id: questionId } });

    return createSuccessResponse({ id: questionId }, 'Question deleted successfully');
  } catch (error) {
    return createErrorResponse(error as Error, 'delete_question', undefined, 500);
  }
}
