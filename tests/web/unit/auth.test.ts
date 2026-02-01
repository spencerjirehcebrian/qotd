import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireAuth } from '@/lib/auth';

function makeRequest(apiKey?: string) {
  const headers = new Headers();
  if (apiKey) headers.set('x-api-key', apiKey);
  return { headers } as unknown as import('next/server').NextRequest;
}

describe('requireAuth', () => {
  const originalEnv = process.env.QOTD_API_KEY;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.QOTD_API_KEY = originalEnv;
    } else {
      delete process.env.QOTD_API_KEY;
    }
  });

  it('returns null when QOTD_API_KEY is not set (auth disabled)', () => {
    delete process.env.QOTD_API_KEY;
    expect(requireAuth(makeRequest())).toBeNull();
  });

  it('returns null when header matches env var', () => {
    process.env.QOTD_API_KEY = 'secret123';
    expect(requireAuth(makeRequest('secret123'))).toBeNull();
  });

  it('returns 401 Response when header is missing', async () => {
    process.env.QOTD_API_KEY = 'secret123';
    const res = requireAuth(makeRequest());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    const body = await res!.json();
    expect(body.error.message).toContain('Unauthorized');
  });

  it('returns 401 Response when header is wrong', async () => {
    process.env.QOTD_API_KEY = 'secret123';
    const res = requireAuth(makeRequest('wrong-key'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });
});
