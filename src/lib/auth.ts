import { NextRequest } from 'next/server';
import { createErrorResponse } from './errorHandler';

/**
 * Check API key authentication for write routes.
 * Returns null if auth passes (or is disabled), or a 401 Response on failure.
 */
export function requireAuth(request: NextRequest): Response | null {
  const serverKey = process.env.QOTD_API_KEY;
  if (!serverKey) return null; // auth disabled

  const clientKey = request.headers.get('x-api-key');
  if (clientKey === serverKey) return null;

  return createErrorResponse('Unauthorized: invalid or missing API key', 'auth', undefined, 401);
}
