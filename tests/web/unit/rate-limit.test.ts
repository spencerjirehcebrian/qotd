import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = rateLimit({ max: 3, windowMs: 10_000 });
    const r1 = limiter.check('1.2.3.4');
    expect(r1.limited).toBe(false);
    expect(r1.remaining).toBe(2);
  });

  it('returns limited: true once max is exceeded', () => {
    const limiter = rateLimit({ max: 2, windowMs: 10_000 });
    limiter.check('1.2.3.4');
    limiter.check('1.2.3.4');
    const r3 = limiter.check('1.2.3.4');
    expect(r3.limited).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('tracks remaining count correctly', () => {
    const limiter = rateLimit({ max: 5, windowMs: 10_000 });
    expect(limiter.check('ip').remaining).toBe(4);
    expect(limiter.check('ip').remaining).toBe(3);
    expect(limiter.check('ip').remaining).toBe(2);
    expect(limiter.check('ip').remaining).toBe(1);
    expect(limiter.check('ip').remaining).toBe(0);
    expect(limiter.check('ip').limited).toBe(true);
  });

  it('resets after window expires', () => {
    const limiter = rateLimit({ max: 1, windowMs: 5_000 });
    limiter.check('ip');
    expect(limiter.check('ip').limited).toBe(true);

    vi.advanceTimersByTime(5_000);

    const r = limiter.check('ip');
    expect(r.limited).toBe(false);
    expect(r.remaining).toBe(0); // max=1, first check uses it
  });

  it('tracks IPs independently', () => {
    const limiter = rateLimit({ max: 1, windowMs: 10_000 });
    limiter.check('a');
    expect(limiter.check('a').limited).toBe(true);

    const rb = limiter.check('b');
    expect(rb.limited).toBe(false);
  });

  it('cleans up expired entries', () => {
    const limiter = rateLimit({ max: 1, windowMs: 5_000 });
    limiter.check('old-ip');

    // Advance past both the window and the cleanup interval (60s)
    vi.advanceTimersByTime(65_000);

    // Trigger cleanup by checking a different IP
    limiter.check('new-ip');

    // The old entry should have been cleaned up.
    // Verify by checking old-ip again -- it should get a fresh window.
    const r = limiter.check('old-ip');
    expect(r.limited).toBe(false);
    expect(r.remaining).toBe(0); // max=1, used it
  });
});
