import { prisma } from "./db";
import type {
  DataClient,
  QuestionData,
  CategoryData,
  CategoryWithCount,
  DuplicateCheckResult,
  StatsData,
  CreateQuestionInput,
  UpdateQuestionInput,
  ListQuestionsFilter,
  BulkCreateResult,
} from "./data-client";

function transformQuestion(q: {
  id: number;
  text: string;
  textNorm: string | null;
  seriousnessLevel: number;
  createdAt: Date;
  updatedAt: Date;
  questionCategories: { category: { id: number; name: string; color: string } }[];
}): QuestionData {
  return {
    id: q.id,
    text: q.text,
    textNorm: q.textNorm,
    seriousnessLevel: q.seriousnessLevel,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    categories: q.questionCategories.map(qc => ({
      id: qc.category.id,
      name: qc.category.name,
      color: qc.category.color,
    })),
  };
}

const questionInclude = {
  questionCategories: { include: { category: true } },
} as const;

export class PrismaDataClient implements DataClient {
  async createQuestion(input: CreateQuestionInput): Promise<QuestionData> {
    const question = await prisma.question.create({
      data: {
        text: input.text,
        textNorm: input.textNorm || undefined,
        seriousnessLevel: input.seriousnessLevel,
        questionCategories: {
          create: input.categoryNames.map(name => ({
            category: { connect: { name } },
          })),
        },
      },
      include: questionInclude,
    });
    return transformQuestion(question);
  }

  async createQuestionsBulk(inputs: CreateQuestionInput[]): Promise<BulkCreateResult> {
    const created: QuestionData[] = [];
    const errors: { index: number; text: string; error: string }[] = [];

    for (let i = 0; i < inputs.length; i++) {
      try {
        const q = await this.createQuestion(inputs[i]);
        created.push(q);
      } catch (err) {
        errors.push({ index: i, text: inputs[i].text, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { created, errors };
  }

  async listQuestions(filter?: ListQuestionsFilter): Promise<QuestionData[]> {
    const where: Record<string, unknown> = {};

    if (filter?.category) {
      where.questionCategories = {
        some: { category: { name: filter.category } },
      };
    }
    if (filter?.seriousnessLevel !== undefined) {
      where.seriousnessLevel = filter.seriousnessLevel;
    }
    if (filter?.search) {
      where.text = { contains: filter.search };
    }

    const questions = await prisma.question.findMany({
      where,
      include: questionInclude,
      orderBy: { id: "desc" },
      take: filter?.limit,
    });

    return questions.map(transformQuestion);
  }

  async getQuestion(id: number): Promise<QuestionData | null> {
    const question = await prisma.question.findUnique({
      where: { id },
      include: questionInclude,
    });
    return question ? transformQuestion(question) : null;
  }

  async updateQuestion(id: number, input: UpdateQuestionInput): Promise<QuestionData> {
    const data: Record<string, unknown> = {};
    if (input.text !== undefined) data.text = input.text;
    if (input.seriousnessLevel !== undefined) data.seriousnessLevel = input.seriousnessLevel;
    if (input.categoryIds !== undefined) {
      data.questionCategories = {
        deleteMany: {},
        createMany: { data: input.categoryIds.map(cid => ({ categoryId: cid })) },
      };
    }

    const question = await prisma.question.update({
      where: { id },
      data,
      include: questionInclude,
    });
    return transformQuestion(question);
  }

  async deleteQuestion(id: number): Promise<void> {
    await prisma.question.delete({ where: { id } });
  }

  async deleteQuestions(ids?: number[]): Promise<number> {
    const where = ids && ids.length > 0 ? { id: { in: ids } } : {};
    const result = await prisma.question.deleteMany({ where });
    return result.count;
  }

  async getQuestionCount(): Promise<number> {
    return prisma.question.count();
  }

  async getAllQuestionTexts(): Promise<string[]> {
    const questions = await prisma.question.findMany({ select: { text: true } });
    return questions.map(q => q.text);
  }

  async checkDuplicate(text: string): Promise<DuplicateCheckResult> {
    const existing = await prisma.question.findFirst({
      where: { text: { contains: text } },
    });
    return {
      isDuplicate: existing !== null,
      existingId: existing?.id ?? null,
      existingText: existing?.text ?? null,
    };
  }

  async listCategories(): Promise<CategoryData[]> {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return categories.map(c => ({ id: c.id, name: c.name, color: c.color }));
  }

  async listCategoriesWithCount(): Promise<CategoryWithCount[]> {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { questionCategories: true } } },
      orderBy: { name: "asc" },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      questionCount: c._count.questionCategories,
    }));
  }

  async getStats(): Promise<StatsData> {
    const total = await prisma.question.count();

    const byLevelRaw = await prisma.question.groupBy({
      by: ["seriousnessLevel"],
      _count: { _all: true },
      orderBy: { seriousnessLevel: "asc" },
    });

    const categoriesRaw = await prisma.category.findMany({
      include: { _count: { select: { questionCategories: true } } },
      orderBy: { name: "asc" },
    });

    return {
      total,
      byLevel: byLevelRaw.map(l => ({
        seriousnessLevel: l.seriousnessLevel,
        count: l._count._all,
      })),
      byCategory: categoriesRaw.map(c => ({
        name: c.name,
        color: c.color,
        count: c._count.questionCategories,
      })),
    };
  }
}
