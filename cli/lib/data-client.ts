import { getRemoteConfig } from "./config";
import { HttpDataClient } from "./data-client-http";
import { PrismaDataClient } from "./data-client-prisma";

export interface QuestionData {
  id: number;
  text: string;
  textNorm?: string | null;
  seriousnessLevel: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  categories: CategoryData[];
}

export interface CategoryData {
  id: number;
  name: string;
  color: string;
}

export interface CategoryWithCount extends CategoryData {
  questionCount: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId: number | null;
  existingText: string | null;
}

export interface StatsData {
  total: number;
  byLevel: { seriousnessLevel: number; count: number }[];
  byCategory: { name: string; color: string; count: number }[];
}

export interface CreateQuestionInput {
  text: string;
  textNorm?: string;
  seriousnessLevel: number;
  categoryNames: string[];
}

export interface UpdateQuestionInput {
  text?: string;
  seriousnessLevel?: number;
  categoryIds?: number[];
}

export interface ListQuestionsFilter {
  category?: string;
  seriousnessLevel?: number;
  search?: string;
  limit?: number;
}

export interface BulkCreateResult {
  created: QuestionData[];
  errors: { index: number; text: string; error: string }[];
}

export interface DataClient {
  createQuestion(input: CreateQuestionInput): Promise<QuestionData>;
  createQuestionsBulk(inputs: CreateQuestionInput[]): Promise<BulkCreateResult>;
  listQuestions(filter?: ListQuestionsFilter): Promise<QuestionData[]>;
  getQuestion(id: number): Promise<QuestionData | null>;
  updateQuestion(id: number, input: UpdateQuestionInput): Promise<QuestionData>;
  deleteQuestion(id: number): Promise<void>;
  deleteQuestions(ids?: number[]): Promise<number>;
  getQuestionCount(): Promise<number>;
  getAllQuestionTexts(): Promise<string[]>;
  checkDuplicate(text: string): Promise<DuplicateCheckResult>;
  listCategories(): Promise<CategoryData[]>;
  listCategoriesWithCount(): Promise<CategoryWithCount[]>;
  getStats(): Promise<StatsData>;
}

let cachedClient: DataClient | null = null;

export function createDataClient(): DataClient {
  if (cachedClient) return cachedClient;

  const remote = getRemoteConfig();
  if (remote) {
    cachedClient = new HttpDataClient(remote.apiUrl, remote.apiKey);
  } else {
    cachedClient = new PrismaDataClient();
  }

  return cachedClient;
}
