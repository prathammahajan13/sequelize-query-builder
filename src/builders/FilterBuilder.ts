// import { WhereOptions } from 'sequelize';
import { FilterOptions, FilterCondition, FilterGroup, FilterResult } from '../types/FilterTypes';
import { FilterProcessor } from '../utils/FilterProcessor';
import { ValidationUtils } from '../utils/ValidationUtils';
import { ValidationError } from '../errors/ValidationError';

export class FilterBuilder {
  private filters: FilterCondition[] = [];
  private processor: FilterProcessor;
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || ValidationUtils.generateRequestId();
    this.processor = new FilterProcessor();
  }

  /**
   * Add a filter condition
   */
  public addFilter(condition: FilterCondition): FilterBuilder {
    this.validateCondition(condition);
    this.filters.push(condition);
    return this;
  }

  /**
   * Add multiple filter conditions
   */
  public addFilters(conditions: FilterCondition[]): FilterBuilder {
    conditions.forEach(condition => this.addFilter(condition));
    return this;
  }

  /**
   * Add a filter group
   */
  public addFilterGroup(group: FilterGroup): FilterBuilder {
    this.validateFilterGroup(group);
    // Convert group to individual conditions for now
    // In a more advanced implementation, we would handle groups properly
    this.flattenFilterGroup(group);
    return this;
  }

  /**
   * Add a simple equality filter
   */
  public where(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'eq',
      value,
    });
  }

  /**
   * Add a not equal filter
   */
  public whereNot(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'ne',
      value,
    });
  }

  /**
   * Add a greater than filter
   */
  public whereGreaterThan(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'gt',
      value,
    });
  }

  /**
   * Add a greater than or equal filter
   */
  public whereGreaterThanOrEqual(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'gte',
      value,
    });
  }

  /**
   * Add a less than filter
   */
  public whereLessThan(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'lt',
      value,
    });
  }

  /**
   * Add a less than or equal filter
   */
  public whereLessThanOrEqual(field: string, value: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'lte',
      value,
    });
  }

  /**
   * Add a like filter
   */
  public whereLike(field: string, value: string, caseSensitive: boolean = true): FilterBuilder {
    return this.addFilter({
      field,
      operator: caseSensitive ? 'like' : 'iLike',
      value,
      caseSensitive,
    });
  }

  /**
   * Add a not like filter
   */
  public whereNotLike(field: string, value: string, caseSensitive: boolean = true): FilterBuilder {
    return this.addFilter({
      field,
      operator: caseSensitive ? 'notLike' : 'notILike',
      value,
      caseSensitive,
    });
  }

  /**
   * Add an in filter
   */
  public whereIn(field: string, values: any[]): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'in',
      value: values,
    });
  }

  /**
   * Add a not in filter
   */
  public whereNotIn(field: string, values: any[]): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'notIn',
      value: values,
    });
  }

  /**
   * Add a between filter
   */
  public whereBetween(field: string, start: any, end: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'between',
      value: [start, end],
    });
  }

  /**
   * Add a not between filter
   */
  public whereNotBetween(field: string, start: any, end: any): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'notBetween',
      value: [start, end],
    });
  }

  /**
   * Add a null filter
   */
  public whereNull(field: string): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'is',
      value: null,
    });
  }

  /**
   * Add a not null filter
   */
  public whereNotNull(field: string): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'isNot',
      value: null,
    });
  }

  /**
   * Add a starts with filter
   */
  public whereStartsWith(
    field: string,
    value: string,
    caseSensitive: boolean = true
  ): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'startsWith',
      value,
      caseSensitive,
    });
  }

  /**
   * Add an ends with filter
   */
  public whereEndsWith(field: string, value: string, caseSensitive: boolean = true): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'endsWith',
      value,
      caseSensitive,
    });
  }

  /**
   * Add a contains filter
   */
  public whereContains(field: string, value: string, caseSensitive: boolean = true): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'contains',
      value,
      caseSensitive,
    });
  }

  /**
   * Add a regex filter
   */
  public whereRegex(field: string, pattern: string): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'regexp',
      value: pattern,
    });
  }

  /**
   * Add a not regex filter
   */
  public whereNotRegex(field: string, pattern: string): FilterBuilder {
    return this.addFilter({
      field,
      operator: 'notRegexp',
      value: pattern,
    });
  }

  /**
   * Process filters and return Sequelize where options
   */
  public build(): FilterResult {
    if (this.filters.length === 0) {
      return {
        where: {},
        errors: [],
        warnings: [],
      };
    }

    return this.processor.process(this.filters);
  }

  /**
   * Process filters from options object
   */
  public processFromOptions(options: FilterOptions): FilterResult {
    const conditions: FilterCondition[] = [];

    // Handle search functionality
    if (options.search && options.searchFields) {
      const searchConditions: FilterCondition[] = options.searchFields.map(field => ({
        field,
        operator: 'contains',
        value: options.search,
        caseSensitive: false,
      }));

      // Add OR condition for search
      conditions.push({
        field: '__search__',
        operator: 'or',
        value: searchConditions,
      } as any);
    }

    // Handle other filter options
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'search' || key === 'searchFields') return;

      if (value !== undefined && value !== null) {
        conditions.push({
          field: key,
          operator: 'eq',
          value,
        });
      }
    });

    return this.processor.process(conditions);
  }

  /**
   * Validate a filter condition
   */
  private validateCondition(condition: FilterCondition): void {
    if (!condition.field) {
      throw new ValidationError(
        'Filter field is required',
        'INVALID_FILTER_FIELD',
        'field',
        condition.field,
        { condition },
        this.requestId
      );
    }

    if (!condition.operator) {
      throw new ValidationError(
        'Filter operator is required',
        'INVALID_FILTER_OPERATOR',
        'operator',
        condition.operator,
        { condition },
        this.requestId
      );
    }

    if (condition.value === undefined && !['is', 'isNot'].includes(condition.operator)) {
      throw new ValidationError(
        'Filter value is required for this operator',
        'INVALID_FILTER_VALUE',
        'value',
        condition.value,
        { condition },
        this.requestId
      );
    }
  }

  /**
   * Validate a filter group
   */
  private validateFilterGroup(group: FilterGroup): void {
    if (!group.operator || !['and', 'or'].includes(group.operator)) {
      throw new ValidationError(
        'Filter group operator must be "and" or "or"',
        'INVALID_FILTER_GROUP_OPERATOR',
        'operator',
        group.operator,
        { group },
        this.requestId
      );
    }

    if (!group.conditions || group.conditions.length === 0) {
      throw new ValidationError(
        'Filter group must have at least one condition',
        'INVALID_FILTER_GROUP_CONDITIONS',
        'conditions',
        group.conditions,
        { group },
        this.requestId
      );
    }
  }

  /**
   * Flatten a filter group into individual conditions
   */
  private flattenFilterGroup(group: FilterGroup): void {
    group.conditions.forEach(condition => {
      if ('operator' in condition && 'conditions' in condition) {
        this.flattenFilterGroup(condition as FilterGroup);
      } else {
        this.addFilter(condition as FilterCondition);
      }
    });
  }

  /**
   * Get all filters
   */
  public getFilters(): FilterCondition[] {
    return [...this.filters];
  }

  /**
   * Clear all filters
   */
  public clear(): FilterBuilder {
    this.filters = [];
    return this;
  }

  /**
   * Get filter count
   */
  public getFilterCount(): number {
    return this.filters.length;
  }

  /**
   * Check if filters exist
   */
  public hasFilters(): boolean {
    return this.filters.length > 0;
  }

  /**
   * Get filters by field
   */
  public getFiltersByField(field: string): FilterCondition[] {
    return this.filters.filter(filter => filter.field === field);
  }

  /**
   * Remove filters by field
   */
  public removeFiltersByField(field: string): FilterBuilder {
    this.filters = this.filters.filter(filter => filter.field !== field);
    return this;
  }

  /**
   * Set the filter processor
   */
  public setProcessor(processor: FilterProcessor): FilterBuilder {
    this.processor = processor;
    return this;
  }

  /**
   * Get the filter processor
   */
  public getProcessor(): FilterProcessor {
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
   * Clone the filter builder
   */
  public clone(): FilterBuilder {
    const cloned = new FilterBuilder(this.requestId);
    cloned.filters = [...this.filters];
    cloned.processor = this.processor;
    return cloned;
  }
}
