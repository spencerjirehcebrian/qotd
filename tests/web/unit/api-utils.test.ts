import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchQuestions, fetchCategories } from '@/utils/api';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchQuestions', () => {
  it('builds correct URL params from all options', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: [] }),
    });

    await fetchQuestions({
      categories: ['Fun', 'Serious'],
      seriousnessMin: 2,
      seriousnessMax: 4,
      limit: 10,
      excludeIds: [1, 2],
    });

    const url: string = mockFetch.mock.calls[0][0];
    const params = new URL(url, 'http://localhost').searchParams;
    expect(params.getAll('categories')).toEqual(['Fun', 'Serious']);
    expect(params.get('seriousnessMin')).toBe('2');
    expect(params.get('seriousnessMax')).toBe('4');
    expect(params.get('limit')).toBe('10');
    expect(params.getAll('excludeIds')).toEqual(['1', '2']);
  });

  it('skips undefined params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: [] }),
    });

    await fetchQuestions({});

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const url: string = lastCall[0];
    const params = new URL(url, 'http://localhost').searchParams;
    expect([...params.keys()]).toEqual([]);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchQuestions({})).rejects.toThrow('Failed to fetch questions');
  });

  it('handles data.data.questions response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { questions: [{ id: 1, text: 'Q1' }] } }),
    });

    const result = await fetchQuestions({});
    expect(result).toEqual([{ id: 1, text: 'Q1' }]);
  });

  it('handles flat data.questions response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: [{ id: 2, text: 'Q2' }] }),
    });

    const result = await fetchQuestions({});
    expect(result).toEqual([{ id: 2, text: 'Q2' }]);
  });
});

describe('fetchCategories', () => {
  it('fetches from /api/categories', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: [{ id: 1, name: 'Fun' }] }),
    });

    const result = await fetchCategories();
    expect(mockFetch).toHaveBeenCalledWith('/api/categories');
    expect(result).toEqual([{ id: 1, name: 'Fun' }]);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(fetchCategories()).rejects.toThrow('Failed to fetch categories');
  });

  it('handles data.data.categories response shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { categories: [{ id: 1, name: 'X' }] } }),
    });

    const result = await fetchCategories();
    expect(result).toEqual([{ id: 1, name: 'X' }]);
  });
});
