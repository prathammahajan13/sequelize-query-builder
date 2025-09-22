export class PaginationError extends Error {
  public readonly code: string;
  public readonly page: number | undefined;
  public readonly pageSize: number | undefined;
  public readonly total: number | undefined;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId: string | undefined;

  constructor(
    message: string,
    code: string = 'PAGINATION_ERROR',
    page?: number,
    pageSize?: number,
    total?: number,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'PaginationError';
    this.code = code;
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaginationError);
    }
  }

  public toJSON(): object {
    return {
      error: true,
      type: this.name,
      message: this.message,
      code: this.code,
      page: this.page,
      pageSize: this.pageSize,
      total: this.total,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }

  public static invalidPage(page: number, totalPages: number, requestId?: string): PaginationError {
    return new PaginationError(
      `Invalid page number: ${page}. Must be between 1 and ${totalPages}`,
      'INVALID_PAGE',
      page,
      undefined,
      undefined,
      { totalPages },
      requestId
    );
  }

  public static invalidPageSize(
    pageSize: number,
    maxPageSize: number,
    requestId?: string
  ): PaginationError {
    return new PaginationError(
      `Invalid page size: ${pageSize}. Must be between 1 and ${maxPageSize}`,
      'INVALID_PAGE_SIZE',
      undefined,
      pageSize,
      undefined,
      { maxPageSize },
      requestId
    );
  }

  public static invalidOffset(offset: number, total: number, requestId?: string): PaginationError {
    return new PaginationError(
      `Invalid offset: ${offset}. Must be between 0 and ${total - 1}`,
      'INVALID_OFFSET',
      undefined,
      undefined,
      total,
      { offset, total },
      requestId
    );
  }
}
