import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleQOTDError,
  createErrorResponse,
  createSuccessResponse,
  ErrorType,
  ErrorSeverity,
} from '@/lib/errorHandler';

describe('classifyError (via handleQOTDError)', () => {
  function classify(msg: string) {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    return handleQOTDError(msg, 'test').errorType;
  }

  it('classifies authentication errors', () => {
    expect(classify('Invalid API key')).toBe(ErrorType.API_AUTHENTICATION);
    expect(classify('Unauthorized access')).toBe(ErrorType.API_AUTHENTICATION);
    expect(classify('authentication failed')).toBe(ErrorType.API_AUTHENTICATION);
    expect(classify('401 error')).toBe(ErrorType.API_AUTHENTICATION);
  });

  it('classifies rate limit errors', () => {
    expect(classify('Rate limit exceeded')).toBe(ErrorType.API_RATE_LIMIT);
    expect(classify('429 Too Many Requests')).toBe(ErrorType.API_RATE_LIMIT);
    expect(classify('too many requests')).toBe(ErrorType.API_RATE_LIMIT);
  });

  it('classifies network errors', () => {
    expect(classify('Connection refused')).toBe(ErrorType.NETWORK);
    expect(classify('Network error')).toBe(ErrorType.NETWORK);
    expect(classify('Request timeout')).toBe(ErrorType.NETWORK);
    expect(classify('DNS resolution failed')).toBe(ErrorType.NETWORK);
    expect(classify('SSL certificate error')).toBe(ErrorType.NETWORK);
  });

  it('classifies database errors', () => {
    expect(classify('Database query failed')).toBe(ErrorType.DATABASE);
    expect(classify('Prisma query failed')).toBe(ErrorType.DATABASE);
    expect(classify('SQL syntax error')).toBe(ErrorType.DATABASE);
    expect(classify('Unique constraint violation')).toBe(ErrorType.DATABASE);
  });

  it('classifies parsing errors', () => {
    expect(classify('JSON parse error')).toBe(ErrorType.RESPONSE_PARSING);
    expect(classify('Failed to decode response')).toBe(ErrorType.RESPONSE_PARSING);
    expect(classify('Invalid format')).toBe(ErrorType.RESPONSE_PARSING);
  });

  it('classifies configuration errors', () => {
    expect(classify('Missing config file')).toBe(ErrorType.CONFIGURATION);
    expect(classify('Environment variable not set')).toBe(ErrorType.CONFIGURATION);
    expect(classify('Required field missing')).toBe(ErrorType.CONFIGURATION);
  });

  it('classifies API response errors by status code', () => {
    expect(classify('Server returned 500')).toBe(ErrorType.API_RESPONSE);
    expect(classify('HTTP 502 Bad Gateway')).toBe(ErrorType.API_RESPONSE);
  });

  it('returns UNKNOWN for unrecognized errors', () => {
    expect(classify('something completely unexpected happened')).toBe(ErrorType.UNKNOWN);
  });
});

describe('handleQOTDError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('returns a well-formed ErrorReport from a string', () => {
    const report = handleQOTDError('test error', 'testOp');
    expect(report).toMatchObject({
      message: 'test error',
      severity: ErrorSeverity.MEDIUM,
    });
    expect(report.timestamp).toBeDefined();
    expect(report.suggestedFix).toBeTypeOf('string');
  });

  it('returns a well-formed ErrorReport from an Error object', () => {
    const err = new Error('database failure');
    const report = handleQOTDError(err, 'testOp', undefined, ErrorSeverity.HIGH);
    expect(report.errorType).toBe(ErrorType.DATABASE);
    expect(report.severity).toBe(ErrorSeverity.HIGH);
    expect(report.originalException).toBe('Error');
    expect(report.stack).toBeDefined();
  });

  it('includes context when provided', () => {
    const ctx = { operation: 'fetchQuestions', category: 'science' };
    const report = handleQOTDError('error', 'op', ctx);
    expect(report.context).toEqual(ctx);
  });
});

describe('createErrorResponse', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('returns a Response with the given status code', async () => {
    const res = createErrorResponse('bad request', 'op', undefined, 400);
    expect(res.status).toBe(400);
  });

  it('returns JSON with error shape', async () => {
    const res = createErrorResponse('fail', 'op');
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.message).toBe('fail');
    expect(body.error.type).toBeTypeOf('string');
    expect(body.error.suggestedFix).toBeTypeOf('string');
    expect(body.error.timestamp).toBeTypeOf('string');
  });

  it('defaults to 500 status', async () => {
    const res = createErrorResponse('fail', 'op');
    expect(res.status).toBe(500);
  });
});

describe('createSuccessResponse', () => {
  it('returns JSON with success, data, message, and timestamp', async () => {
    const res = createSuccessResponse({ items: [1, 2] }, 'ok');
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ items: [1, 2] });
    expect(body.message).toBe('ok');
    expect(body.timestamp).toBeTypeOf('string');
  });

  it('message is undefined when omitted', async () => {
    const res = createSuccessResponse('hello');
    const body = await res.json();
    expect(body.message).toBeUndefined();
    expect(body.data).toBe('hello');
  });
});
