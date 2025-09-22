export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
  enableOffset: boolean;
  enableCursor: boolean;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
  cursor?: string;
  direction?: 'next' | 'prev';
}

export interface PaginationResult {
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  direction?: 'next' | 'prev';
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CursorPaginationResult {
  data: any[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
  };
}

export interface PaginationProcessor {
  process(options: PaginationOptions): {
    offset: number;
    limit: number;
    page: number;
    pageSize: number;
  };
  validate(options: PaginationOptions): {
    isValid: boolean;
    errors: string[];
  };
  calculateTotalPages(total: number, pageSize: number): number;
  calculateOffset(page: number, pageSize: number): number;
}
