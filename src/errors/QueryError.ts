export class QueryError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId: string | undefined;

  constructor(message: string, code: string = 'QUERY_ERROR', details?: any, requestId?: string) {
    super(message);
    this.name = 'QueryError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryError);
    }
  }

  public toJSON(): object {
    return {
      error: true,
      type: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }

  public static fromError(error: Error, code?: string, requestId?: string): QueryError {
    return new QueryError(
      error.message,
      code || 'QUERY_ERROR',
      { originalError: error.name, stack: error.stack },
      requestId
    );
  }
}
