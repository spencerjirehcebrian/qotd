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

export class HttpDataClient implements DataClient {
  constructor(
    private apiUrl: string,
    private apiKey: string,
  ) {
    // Strip trailing slash
    this.apiUrl = apiUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> | undefined),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const json = await res.json();
    if (json.success === false) {
      throw new Error(json.error?.message || "Request failed");
    }
    return json.data as T;
  }

  async createQuestion(input: CreateQuestionInput): Promise<QuestionData> {
    const data = await this.request<{ question: QuestionData }>("/api/questions", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.question;
  }

  async createQuestionsBulk(inputs: CreateQuestionInput[]): Promise<BulkCreateResult> {
    return this.request<BulkCreateResult>("/api/questions/bulk", {
      method: "POST",
      body: JSON.stringify({ questions: inputs }),
    });
  }

  async listQuestions(filter?: ListQuestionsFilter): Promise<QuestionData[]> {
    const params = new URLSearchParams();
    if (filter?.category) params.set("categories", filter.category);
    if (filter?.seriousnessLevel !== undefined) {
      params.set("seriousnessMin", String(filter.seriousnessLevel));
      params.set("seriousnessMax", String(filter.seriousnessLevel));
    }
    if (filter?.limit) params.set("limit", String(filter.limit));
    // Note: search filter not supported by the GET /api/questions endpoint
    // but we include all questions and could filter client-side if needed

    const qs = params.toString();
    const data = await this.request<{ questions: QuestionData[] }>(
      `/api/questions${qs ? `?${qs}` : ""}`
    );
    let questions = data.questions;

    // Client-side text search if filter has search (not supported server-side on GET)
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      questions = questions.filter(q => q.text.toLowerCase().includes(term));
    }

    return questions;
  }

  async getQuestion(id: number): Promise<QuestionData | null> {
    try {
      const data = await this.request<{ question: QuestionData }>(`/api/questions/${id}`);
      return data.question;
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) return null;
      throw err;
    }
  }

  async updateQuestion(id: number, input: UpdateQuestionInput): Promise<QuestionData> {
    const data = await this.request<{ question: QuestionData }>(`/api/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return data.question;
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.request(`/api/questions/${id}`, { method: "DELETE" });
  }

  async deleteQuestions(ids?: number[]): Promise<number> {
    const data = await this.request<{ count: number }>("/api/questions", {
      method: "DELETE",
      body: JSON.stringify(ids ? { ids } : {}),
    });
    return data.count;
  }

  async getQuestionCount(): Promise<number> {
    const stats = await this.getStats();
    return stats.total;
  }

  async getAllQuestionTexts(): Promise<string[]> {
    const data = await this.request<{ texts: string[] }>("/api/questions/texts");
    return data.texts;
  }

  async checkDuplicate(text: string): Promise<DuplicateCheckResult> {
    const params = new URLSearchParams({ text });
    return this.request<DuplicateCheckResult>(`/api/questions/check-duplicate?${params}`);
  }

  async listCategories(): Promise<CategoryData[]> {
    const data = await this.request<{ categories: CategoryData[] }>("/api/categories");
    return data.categories;
  }

  async listCategoriesWithCount(): Promise<CategoryWithCount[]> {
    const data = await this.request<{ categories: CategoryWithCount[] }>("/api/categories?withCount=true");
    return data.categories;
  }

  async getStats(): Promise<StatsData> {
    return this.request<StatsData>("/api/questions/stats");
  }
}
