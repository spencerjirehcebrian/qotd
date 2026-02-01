/**
 * Centralized error handling utilities for QOTD Next.js API routes.
 */

export enum ErrorType {
  API_CONNECTION = 'api_connection',
  API_AUTHENTICATION = 'api_authentication',
  API_RATE_LIMIT = 'api_rate_limit',
  API_RESPONSE = 'api_response',
  RESPONSE_PARSING = 'response_parsing',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  DATABASE = 'database',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  operation: string;
  category?: string;
  seriousnessLevel?: number;
  responseTimeMs?: number;
  httpStatusCode?: number;
  [key: string]: string | number | string[] | null | undefined;
}

export interface ErrorReport {
  errorType: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalException?: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
  suggestedFix?: string;
}

function classifyError(error: Error | string): ErrorType {
  const errorStr = (typeof error === 'string' ? error : error.message).toLowerCase();

  if (errorStr.includes('api key') || errorStr.includes('unauthorized') || errorStr.includes('authentication') || errorStr.includes('401')) {
    return ErrorType.API_AUTHENTICATION;
  }
  if (errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('too many requests')) {
    return ErrorType.API_RATE_LIMIT;
  }
  if (errorStr.includes('connection') || errorStr.includes('network') || errorStr.includes('timeout') || errorStr.includes('dns') || errorStr.includes('ssl')) {
    return ErrorType.NETWORK;
  }
  if (errorStr.includes('database') || errorStr.includes('prisma') || errorStr.includes('sql') || errorStr.includes('constraint')) {
    return ErrorType.DATABASE;
  }
  if (errorStr.match(/\b(400|401|403|404|500|502|503)\b/)) {
    return ErrorType.API_RESPONSE;
  }
  if (errorStr.includes('json') || errorStr.includes('parse') || errorStr.includes('decode') || errorStr.includes('format')) {
    return ErrorType.RESPONSE_PARSING;
  }
  if (errorStr.includes('config') || errorStr.includes('environment') || errorStr.includes('missing') || errorStr.includes('required')) {
    return ErrorType.CONFIGURATION;
  }
  if (errorStr.trim().match(/^\d+$/) || errorStr === "'0'") {
    return ErrorType.API_RESPONSE;
  }

  return ErrorType.UNKNOWN;
}

function getSuggestedFix(errorType: ErrorType): string {
  const suggestions: Record<ErrorType, string> = {
    [ErrorType.API_CONNECTION]: 'API connection failed. Check network connectivity and API endpoint.',
    [ErrorType.API_AUTHENTICATION]: 'Check your ZAI_API_KEY environment variable. Ensure it\'s valid and not expired.',
    [ErrorType.API_RATE_LIMIT]: 'Rate limit exceeded. Wait before retrying or reduce request frequency.',
    [ErrorType.NETWORK]: 'Check your internet connection and DNS settings. Try again in a few moments.',
    [ErrorType.API_RESPONSE]: 'API returned an error response. Check API status and your request parameters.',
    [ErrorType.RESPONSE_PARSING]: 'Failed to parse API response. The API response format may have changed.',
    [ErrorType.CONFIGURATION]: 'Check your configuration files and environment variables.',
    [ErrorType.DATABASE]: 'Database operation failed. Check database connection and query parameters.',
    [ErrorType.VALIDATION]: 'Input validation failed. Check your input parameters and format.',
    [ErrorType.UNKNOWN]: 'An unexpected error occurred. Check logs for more details.'
  };
  return suggestions[errorType] || 'No specific fix available.';
}

function logError(errorReport: ErrorReport): void {
  const logData = {
    errorType: errorReport.errorType,
    severity: errorReport.severity,
    message: errorReport.message,
    operation: errorReport.context?.operation || 'unknown',
    suggestedFix: errorReport.suggestedFix,
    timestamp: errorReport.timestamp
  };

  if (errorReport.context) {
    Object.assign(logData, errorReport.context);
  }

  const logMessage = JSON.stringify(logData, null, 2);

  if (errorReport.severity === ErrorSeverity.HIGH || errorReport.severity === ErrorSeverity.CRITICAL) {
    console.error(`ERROR: ${logMessage}`);
  } else if (errorReport.severity === ErrorSeverity.MEDIUM) {
    console.warn(`WARNING: ${logMessage}`);
  } else {
    console.info(`INFO: ${logMessage}`);
  }

  if (errorReport.stack) {
    console.debug(`STACK_TRACE: ${errorReport.stack}`);
  }
}

export function handleQOTDError(
  error: Error | string,
  operation: string,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): ErrorReport {
  const errorType = classifyError(error);

  const errorReport: ErrorReport = {
    errorType,
    severity,
    message: typeof error === 'string' ? error : error.message,
    originalException: typeof error === 'object' ? error.constructor.name : undefined,
    stack: typeof error === 'object' ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    suggestedFix: getSuggestedFix(errorType)
  };

  logError(errorReport);

  return errorReport;
}

export function createErrorResponse(
  error: Error | string,
  operation: string,
  context?: ErrorContext,
  statusCode: number = 500
): Response {
  const errorReport = handleQOTDError(error, operation, context, ErrorSeverity.HIGH);

  return Response.json({
    error: {
      message: errorReport.message,
      type: errorReport.errorType,
      suggestedFix: errorReport.suggestedFix,
      timestamp: errorReport.timestamp
    }
  }, { status: statusCode });
}

export function createSuccessResponse<T>(data: T, message?: string): Response {
  return Response.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
}
