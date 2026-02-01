import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
});

export function middleware(request: NextRequest) {
  // Skip rate limiting for authenticated requests
  const serverKey = process.env.QOTD_API_KEY;
  if (serverKey && request.headers.get('x-api-key') === serverKey) {
    return NextResponse.next();
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';

  const { limited, remaining, resetAt } = limiter.check(ip);

  if (limited) {
    return NextResponse.json(
      {
        error: {
          message: 'Too many requests. Please try again later.',
          type: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}

export const config = {
  matcher: ['/api/questions', '/api/categories'],
};
