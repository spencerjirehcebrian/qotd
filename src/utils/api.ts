import { Question, Category } from '@/types';

const API_BASE = '/api';

export async function fetchQuestions(params: {
  categories?: string[];
  seriousnessMin?: number;
  seriousnessMax?: number;
  limit?: number;
  excludeIds?: number[];
}): Promise<Question[]> {
  const searchParams = new URLSearchParams();
  
  if (params.categories?.length) {
    params.categories.forEach(cat => searchParams.append('categories', cat));
  }
  if (params.seriousnessMin !== undefined) {
    searchParams.append('seriousnessMin', params.seriousnessMin.toString());
  }
  if (params.seriousnessMax !== undefined) {
    searchParams.append('seriousnessMax', params.seriousnessMax.toString());
  }
  if (params.limit !== undefined) {
    searchParams.append('limit', params.limit.toString());
  }
  if (params.excludeIds?.length) {
    params.excludeIds.forEach(id => searchParams.append('excludeIds', id.toString()));
  }

  const response = await fetch(`${API_BASE}/questions?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  
  const data = await response.json();
  return data.data?.questions ?? data.questions;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.data?.categories ?? data.categories;
}