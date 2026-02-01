interface WindowEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiter {
  check(ip: string): RateLimitResult;
}

const CLEANUP_INTERVAL_MS = 60_000;

export function rateLimit({
  windowMs = 60_000,
  max = 100,
}: { windowMs?: number; max?: number } = {}): RateLimiter {
  const store = new Map<string, WindowEntry>();
  let lastCleanup = Date.now();

  function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }

  return {
    check(ip: string): RateLimitResult {
      const now = Date.now();
      cleanup(now);

      let entry = store.get(ip);

      if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(ip, entry);
      }

      entry.count++;

      if (entry.count > max) {
        return {
          limited: true,
          remaining: 0,
          resetAt: entry.resetAt,
        };
      }

      return {
        limited: false,
        remaining: max - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}
