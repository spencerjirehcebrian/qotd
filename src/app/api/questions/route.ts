import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  handleQOTDError,
  createErrorResponse,
  createSuccessResponse,
  ErrorSeverity
} from '@/lib/errorHandler';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const categories = searchParams.getAll('categories');
    const seriousnessMin = searchParams.get('seriousnessMin');
    const seriousnessMax = searchParams.get('seriousnessMax');
    const limit = searchParams.get('limit');
    const excludeIds = searchParams.getAll('excludeIds').map(id => parseInt(id));

    const where: Prisma.QuestionWhereInput = {};

    // Filter by categories
    if (categories.length > 0) {
      where.questionCategories = {
        some: {
          category: {
            name: {
              in: categories
            }
          }
        }
      };
    }

    // Filter by seriousness level
    if (seriousnessMin || seriousnessMax) {
      where.seriousnessLevel = {};
      if (seriousnessMin) where.seriousnessLevel.gte = parseInt(seriousnessMin);
      if (seriousnessMax) where.seriousnessLevel.lte = parseInt(seriousnessMax);
    }

    // Exclude specific IDs
    if (excludeIds.length > 0) {
      where.id = {
        notIn: excludeIds
      };
    }

    const allQuestions = await prisma.question.findMany({
      where,
      include: {
        questionCategories: {
          include: {
            category: true
          }
        }
      },
    });

    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    const questions = limit ? allQuestions.slice(0, parseInt(limit)) : allQuestions;

    // Transform the data to match our frontend types
    const transformedQuestions = questions.map(question => ({
      ...question,
      categories: question.questionCategories.map(qc => qc.category)
    }));

    return createSuccessResponse({ questions: transformedQuestions }, 'Questions fetched successfully');
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const errorReport = handleQOTDError(
      error as Error,
      'fetch_questions',
      {
        operation: 'fetch_questions',
        categories: searchParams.getAll('categories'),
        seriousnessMin: searchParams.get('seriousnessMin'),
        seriousnessMax: searchParams.get('seriousnessMax'),
        limit: searchParams.get('limit'),
        responseTimeMs: Date.now() - startTime
      },
      ErrorSeverity.HIGH
    );
    
    return createErrorResponse(
      error as Error,
      'fetch_questions',
      errorReport.context,
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { text, seriousnessLevel, categoryNames } = body;

    if (!text || typeof text !== 'string') {
      return createErrorResponse('text is required', 'create_question', undefined, 400);
    }
    if (!seriousnessLevel || typeof seriousnessLevel !== 'number' || seriousnessLevel < 1 || seriousnessLevel > 5) {
      return createErrorResponse('seriousnessLevel must be 1-5', 'create_question', undefined, 400);
    }
    if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
      return createErrorResponse('categoryNames must be a non-empty array', 'create_question', undefined, 400);
    }

    const validCategories = await prisma.category.findMany({
      where: { name: { in: categoryNames } },
    });
    const validNames = new Set(validCategories.map(c => c.name));
    const invalidNames = categoryNames.filter((n: string) => !validNames.has(n));

    if (invalidNames.length > 0) {
      return createErrorResponse(
        `Invalid category names: ${invalidNames.join(', ')}`,
        'create_question',
        undefined,
        400
      );
    }

    const question = await prisma.question.create({
      data: {
        text,
        seriousnessLevel,
        questionCategories: {
          create: categoryNames.map((name: string) => ({
            category: { connect: { name } },
          })),
        },
      },
      include: {
        questionCategories: { include: { category: true } },
      },
    });

    const transformed = {
      ...question,
      categories: question.questionCategories.map(qc => qc.category),
    };

    return createSuccessResponse({ question: transformed }, 'Question created successfully');
  } catch (error) {
    return createErrorResponse(error as Error, 'create_question', undefined, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const ids: number[] | undefined = body.ids;

    let result;
    if (Array.isArray(ids) && ids.length > 0) {
      result = await prisma.question.deleteMany({ where: { id: { in: ids } } });
    } else {
      result = await prisma.question.deleteMany({});
    }

    return createSuccessResponse({ count: result.count }, 'Questions deleted successfully');
  } catch (error) {
    return createErrorResponse(error as Error, 'delete_questions', undefined, 500);
  }
}