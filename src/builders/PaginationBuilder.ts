import { PaginationOptions, PaginationResult, PaginationConfig } from '../types/PaginationTypes';
import { PaginationError } from '../errors/PaginationError';
// import { ValidationUtils } from '../utils/ValidationUtils';

export class PaginationBuilder {
  private config: PaginationConfig;

  constructor(config: Partial<PaginationConfig> = {}) {
    this.config = {
      defaultPageSize: config.defaultPageSize || 10,
      maxPageSize: config.maxPageSize || 100,
      enableOffset: config.enableOffset !== false,
      enableCursor: config.enableCursor || false,
    };
  }

  /**
   * Process pagination options and return offset/limit
   */
  public process(options: PaginationOptions): {
    offset: number;
    limit: number;
    page: number;
    pageSize: number;
  } {
    const validation = this.validate(options);
    if (!validation.isValid) {
      throw new PaginationError(
        `Invalid pagination options: ${validation.errors.join(', ')}`,
        'INVALID_PAGINATION_OPTIONS',
        options.page,
        options.pageSize
      );
    }

    const page = options.page || 1;
    const pageSize = Math.min(
      options.pageSize || this.config.defaultPageSize,
      this.config.maxPageSize
    );

    let offset: number;
    let limit: number;

    if (options.offset !== undefined && this.config.enableOffset) {
      offset = options.offset;
      limit = options.limit || this.config.defaultPageSize;
    } else {
      offset = this.calculateOffset(page, pageSize);
      limit = pageSize;
    }

    return { offset, limit, page, pageSize };
  }

  /**
   * Validate pagination options
   */
  public validate(options: PaginationOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.page !== undefined) {
      if (!Number.isInteger(options.page) || options.page < 1) {
        errors.push('Page must be a positive integer');
      }
    }

    if (options.pageSize !== undefined) {
      if (!Number.isInteger(options.pageSize) || options.pageSize < 1) {
        errors.push('Page size must be a positive integer');
      } else if (options.pageSize > this.config.maxPageSize) {
        errors.push(`Page size cannot exceed ${this.config.maxPageSize}`);
      }
    }

    if (options.offset !== undefined) {
      if (!Number.isInteger(options.offset) || options.offset < 0) {
        errors.push('Offset must be a non-negative integer');
      }
    }

    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < 1) {
        errors.push('Limit must be a positive integer');
      } else if (options.limit > this.config.maxPageSize) {
        errors.push(`Limit cannot exceed ${this.config.maxPageSize}`);
      }
    }

    // Validate that either page/pageSize or offset/limit is provided, not both
    const hasPageBased = options.page !== undefined || options.pageSize !== undefined;
    const hasOffsetBased = options.offset !== undefined || options.limit !== undefined;

    if (hasPageBased && hasOffsetBased) {
      errors.push('Cannot use both page-based and offset-based pagination');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate offset from page and page size
   */
  public calculateOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  /**
   * Calculate total pages from total count and page size
   */
  public calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  /**
   * Build pagination result
   */
  public buildResult(data: any[], total: number, page: number, pageSize: number): PaginationResult {
    const totalPages = this.calculateTotalPages(total, pageSize);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Validate page number against total pages
   */
  public validatePage(page: number, totalPages: number, requestId?: string): void {
    if (page < 1 || page > totalPages) {
      throw PaginationError.invalidPage(page, totalPages, requestId);
    }
  }

  /**
   * Validate page size against maximum allowed
   */
  public validatePageSize(pageSize: number, requestId?: string): void {
    if (pageSize < 1 || pageSize > this.config.maxPageSize) {
      throw PaginationError.invalidPageSize(pageSize, this.config.maxPageSize, requestId);
    }
  }

  /**
   * Validate offset against total count
   */
  public validateOffset(offset: number, total: number, requestId?: string): void {
    if (offset < 0 || offset >= total) {
      throw PaginationError.invalidOffset(offset, total, requestId);
    }
  }

  /**
   * Get pagination metadata
   */
  public getMetadata(
    page: number,
    pageSize: number,
    total: number
  ): {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    startIndex: number;
    endIndex: number;
  } {
    const totalPages = this.calculateTotalPages(total, pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, total - 1);

    return {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex,
      endIndex,
    };
  }

  /**
   * Get the current configuration
   */
  public getConfig(): PaginationConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<PaginationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if pagination is enabled
   */
  public isEnabled(): boolean {
    return this.config.defaultPageSize > 0;
  }

  /**
   * Disable pagination
   */
  public disable(): void {
    this.config.defaultPageSize = 0;
  }

  /**
   * Enable pagination
   */
  public enable(defaultPageSize: number = 10): void {
    this.config.defaultPageSize = defaultPageSize;
  }
}
