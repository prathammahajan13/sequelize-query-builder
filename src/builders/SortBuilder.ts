// import { Order } from 'sequelize';
import { SortCondition, SortResult } from '../types/SortTypes';
import { SortProcessor } from '../utils/SortProcessor';
import { ValidationUtils } from '../utils/ValidationUtils';
import { ValidationError } from '../errors/ValidationError';

export class SortBuilder {
  private sorts: SortCondition[] = [];
  private processor: SortProcessor;
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || ValidationUtils.generateRequestId();
    this.processor = new SortProcessor();
  }

  /**
   * Add a sort condition
   */
  public addSort(condition: SortCondition): SortBuilder {
    this.validateCondition(condition);
    this.sorts.push(condition);
    return this;
  }

  /**
   * Add multiple sort conditions
   */
  public addSorts(conditions: SortCondition[]): SortBuilder {
    conditions.forEach(condition => this.addSort(condition));
    return this;
  }

  /**
   * Add a simple sort by column
   */
  public orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): SortBuilder {
    return this.addSort({
      column,
      order,
    });
  }

  /**
   * Add ascending sort
   */
  public orderByAsc(column: string): SortBuilder {
    return this.addSort({
      column,
      order: 'ASC',
    });
  }

  /**
   * Add descending sort
   */
  public orderByDesc(column: string): SortBuilder {
    return this.addSort({
      column,
      order: 'DESC',
    });
  }

  /**
   * Add sort with nulls first
   */
  public orderByWithNullsFirst(column: string, order: 'ASC' | 'DESC' = 'ASC'): SortBuilder {
    return this.addSort({
      column,
      order,
      nulls: 'first',
    });
  }

  /**
   * Add sort with nulls last
   */
  public orderByWithNullsLast(column: string, order: 'ASC' | 'DESC' = 'ASC'): SortBuilder {
    return this.addSort({
      column,
      order,
      nulls: 'last',
    });
  }

  /**
   * Add case-insensitive sort
   */
  public orderByCaseInsensitive(column: string, order: 'ASC' | 'DESC' = 'ASC'): SortBuilder {
    return this.addSort({
      column,
      order,
      caseSensitive: false,
    });
  }

  /**
   * Add sort with custom options
   */
  public orderByCustom(
    column: string,
    order: 'ASC' | 'DESC' = 'ASC',
    options?: {
      nulls?: 'first' | 'last';
      caseSensitive?: boolean;
    }
  ): SortBuilder {
    const sortCondition: any = {
      column,
      order,
    };
    if (options?.nulls) sortCondition.nulls = options.nulls;
    if (options?.caseSensitive !== undefined) sortCondition.caseSensitive = options.caseSensitive;

    return this.addSort(sortCondition);
  }

  /**
   * Process sorts and return Sequelize order options
   */
  public build(): SortResult {
    if (this.sorts.length === 0) {
      return {
        order: [],
        errors: [],
        warnings: [],
      };
    }

    return this.processor.process(this.sorts);
  }

  /**
   * Process sorts from options object
   */
  public processFromOptions(options: any): SortResult {
    const conditions: SortCondition[] = [];

    if (options.column && options.order) {
      conditions.push({
        column: options.column,
        order: options.order,
        nulls: options.nulls,
        caseSensitive: options.caseSensitive,
      });
    }

    return this.processor.process(conditions);
  }

  /**
   * Validate a sort condition
   */
  private validateCondition(condition: SortCondition): void {
    if (!condition.column) {
      throw new ValidationError(
        'Sort column is required',
        'INVALID_SORT_COLUMN',
        'column',
        condition.column,
        { condition },
        this.requestId
      );
    }

    if (condition.order && !['ASC', 'DESC'].includes(condition.order)) {
      throw new ValidationError(
        'Sort order must be "ASC" or "DESC"',
        'INVALID_SORT_ORDER',
        'order',
        condition.order,
        { condition },
        this.requestId
      );
    }

    if (condition.nulls && !['first', 'last'].includes(condition.nulls)) {
      throw new ValidationError(
        'Sort nulls must be "first" or "last"',
        'INVALID_SORT_NULLS',
        'nulls',
        condition.nulls,
        { condition },
        this.requestId
      );
    }
  }

  /**
   * Get all sorts
   */
  public getSorts(): SortCondition[] {
    return [...this.sorts];
  }

  /**
   * Clear all sorts
   */
  public clear(): SortBuilder {
    this.sorts = [];
    return this;
  }

  /**
   * Get sort count
   */
  public getSortCount(): number {
    return this.sorts.length;
  }

  /**
   * Check if sorts exist
   */
  public hasSorts(): boolean {
    return this.sorts.length > 0;
  }

  /**
   * Get sorts by column
   */
  public getSortsByColumn(column: string): SortCondition[] {
    return this.sorts.filter(sort => sort.column === column);
  }

  /**
   * Remove sorts by column
   */
  public removeSortsByColumn(column: string): SortBuilder {
    this.sorts = this.sorts.filter(sort => sort.column !== column);
    return this;
  }

  /**
   * Check if a column is already sorted
   */
  public hasColumn(column: string): boolean {
    return this.getSortsByColumn(column).length > 0;
  }

  /**
   * Get the primary sort (first sort)
   */
  public getPrimarySort(): SortCondition | null {
    return this.sorts.length > 0 ? this.sorts[0] || null : null;
  }

  /**
   * Get the secondary sort (second sort)
   */
  public getSecondarySort(): SortCondition | null {
    return this.sorts.length > 1 ? this.sorts[1] || null : null;
  }

  /**
   * Set the primary sort (replaces first sort)
   */
  public setPrimarySort(condition: SortCondition): SortBuilder {
    this.validateCondition(condition);
    if (this.sorts.length === 0) {
      this.sorts.push(condition);
    } else {
      this.sorts[0] = condition;
    }
    return this;
  }

  /**
   * Set the secondary sort (replaces second sort)
   */
  public setSecondarySort(condition: SortCondition): SortBuilder {
    this.validateCondition(condition);
    if (this.sorts.length <= 1) {
      this.sorts.push(condition);
    } else {
      this.sorts[1] = condition;
    }
    return this;
  }

  /**
   * Set the filter processor
   */
  public setProcessor(processor: SortProcessor): SortBuilder {
    this.processor = processor;
    return this;
  }

  /**
   * Get the filter processor
   */
  public getProcessor(): SortProcessor {
    return this.processor;
  }

  /**
   * Get the request ID
   */
  public getRequestId(): string {
    return this.requestId;
  }

  /**
   * Set a new request ID
   */
  public setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Clone the sort builder
   */
  public clone(): SortBuilder {
    const cloned = new SortBuilder(this.requestId);
    cloned.sorts = [...this.sorts];
    cloned.processor = this.processor;
    return cloned;
  }

  /**
   * Get sort statistics
   */
  public getStats(): {
    totalSorts: number;
    ascSorts: number;
    descSorts: number;
    columns: string[];
  } {
    const ascSorts = this.sorts.filter(sort => sort.order === 'ASC').length;
    const descSorts = this.sorts.filter(sort => sort.order === 'DESC').length;
    const columns = this.sorts.map(sort => sort.column);

    return {
      totalSorts: this.sorts.length,
      ascSorts,
      descSorts,
      columns: [...new Set(columns)],
    };
  }
}
