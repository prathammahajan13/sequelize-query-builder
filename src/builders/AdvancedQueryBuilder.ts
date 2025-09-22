import { WhereOptions } from 'sequelize';
import { BasicQueryBuilder } from './BasicQueryBuilder';
import { PaginationBuilder } from './PaginationBuilder';
import { FilterBuilder } from './FilterBuilder';
import { SortBuilder } from './SortBuilder';
import { JoinBuilder } from './JoinBuilder';
import { CacheManager } from '../utils/CacheManager';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { ValidationUtils } from '../utils/ValidationUtils';
import {
  QueryBuilderOptions,
  AdvancedQueryOptions,
  QueryResult,
  QueryContext,
} from '../types/QueryTypes';
import { QueryError } from '../errors/QueryError';
import { ValidationError } from '../errors/ValidationError';

export class AdvancedQueryBuilder extends BasicQueryBuilder {
  private paginationBuilder: PaginationBuilder;
  private filterBuilder: FilterBuilder;
  private sortBuilder: SortBuilder;
  private joinBuilder: JoinBuilder;
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private currentOptions: AdvancedQueryOptions = {};

  constructor(options: QueryBuilderOptions) {
    super(options);

    this.paginationBuilder = new PaginationBuilder(this.config);
    this.filterBuilder = new FilterBuilder(this.requestId);
    this.sortBuilder = new SortBuilder(this.requestId);
    this.joinBuilder = new JoinBuilder(this.model, this.requestId);

    this.cacheManager = new CacheManager(
      new (require('../utils/CacheManager').MemoryCacheProvider)(),
      this.config.enableCaching,
      this.config.cacheTTL
    );

    this.performanceMonitor = new PerformanceMonitor(
      this.config.enablePerformanceMonitoring,
      this.config.performanceThreshold
    );
  }

  /**
   * Set pagination options
   */
  public withPagination(options: any): AdvancedQueryBuilder {
    const validation = ValidationUtils.validatePagination(options, this.config, this.requestId);
    if (!validation.isValid) {
      throw validation.error;
    }

    this.currentOptions.pagination = validation.data;
    return this;
  }

  /**
   * Set filter options
   */
  public withFilters(options: any): AdvancedQueryBuilder {
    const validation = ValidationUtils.validateFilters(options, undefined, this.requestId);
    if (!validation.isValid) {
      throw validation.error;
    }

    this.currentOptions.filters = validation.data;
    return this;
  }

  /**
   * Set sorting options
   */
  public withSorting(options: any): AdvancedQueryBuilder {
    const validation = ValidationUtils.validateSorting(options, undefined, this.requestId);
    if (!validation.isValid) {
      throw validation.error;
    }

    this.currentOptions.sorting = [validation.data];
    return this;
  }

  /**
   * Set multiple sorting options
   */
  public withSortings(sorts: any[]): AdvancedQueryBuilder {
    const validations = sorts.map(sort =>
      ValidationUtils.validateSorting(sort, undefined, this.requestId)
    );

    const errors = validations.filter(v => !v.isValid);
    if (errors.length > 0 && errors[0] && errors[0].error) {
      throw errors[0].error;
    }

    this.currentOptions.sorting = validations.map(v => v.data);
    return this;
  }

  /**
   * Set join options
   */
  public withJoins(joins: any[]): AdvancedQueryBuilder {
    const validation = ValidationUtils.validateJoins(joins, undefined, this.requestId);
    if (!validation.isValid) {
      throw validation.error;
    }

    this.currentOptions.joins = validation.data;
    return this;
  }

  /**
   * Set attributes to select
   */
  public withAttributes(attributes: string[]): AdvancedQueryBuilder {
    this.currentOptions.attributes = attributes;
    return this;
  }

  /**
   * Set where conditions
   */
  public withWhere(where: WhereOptions): AdvancedQueryBuilder {
    this.currentOptions.where = where;
    return this;
  }

  /**
   * Set group by columns
   */
  public withGroup(group: string[]): AdvancedQueryBuilder {
    this.currentOptions.group = group;
    return this;
  }

  /**
   * Set having conditions
   */
  public withHaving(having: WhereOptions): AdvancedQueryBuilder {
    this.currentOptions.having = having;
    return this;
  }

  /**
   * Enable distinct results
   */
  public withDistinct(distinct: boolean = true): AdvancedQueryBuilder {
    this.currentOptions.distinct = distinct;
    return this;
  }

  /**
   * Enable subquery
   */
  public withSubQuery(subQuery: boolean = true): AdvancedQueryBuilder {
    this.currentOptions.subQuery = subQuery;
    return this;
  }

  /**
   * Enable benchmarking
   */
  public withBenchmark(benchmark: boolean = true): AdvancedQueryBuilder {
    this.currentOptions.benchmark = benchmark;
    return this;
  }

  /**
   * Enable query logging
   */
  public withLogging(logging: boolean = true): AdvancedQueryBuilder {
    this.currentOptions.logging = logging;
    return this;
  }

  /**
   * Execute the advanced query
   */
  public async execute(): Promise<QueryResult> {
    const context: QueryContext = {
      method: 'findAll',
      model: this.model,
      options: this.currentOptions,
      startTime: Date.now(),
      requestId: this.requestId,
    };

    const monitorId = this.performanceMonitor.startMonitoring(context);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey();
      if (this.cacheManager.isEnabled()) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          this.performanceMonitor.recordCacheHit(monitorId);
          return cached;
        }
      }

      // Build query options
      const queryOptions = await this.buildQueryOptions();

      // Execute query
      const startTime = Date.now();
      const result = await (this.model as any).findAll(queryOptions);
      const executionTime = Date.now() - startTime;

      this.performanceMonitor.recordQueryExecution(monitorId, executionTime);

      // Handle pagination
      let finalResult: QueryResult;
      if (this.currentOptions.pagination) {
        const pagination = this.paginationBuilder.process(this.currentOptions.pagination);
        const total = await this.getTotalCount(queryOptions);
        finalResult = this.paginationBuilder.buildResult(
          result,
          total,
          pagination.page,
          pagination.pageSize
        );
      } else {
        finalResult = {
          data: result,
          performance: {
            executionTime,
            queryCount: 1,
            cacheHit: false,
          },
        };
      }

      // Cache result
      if (this.cacheManager.isEnabled()) {
        await this.cacheManager.set(cacheKey, finalResult);
      }

      // Record performance metrics
      const metrics = this.performanceMonitor.endMonitoring(monitorId);
      if (metrics) {
        finalResult.performance = {
          executionTime: metrics.totalExecutionTime,
          queryCount: metrics.queryCount,
          cacheHit: false,
        };
      }

      return finalResult;
    } catch (error) {
      this.performanceMonitor.endMonitoring(monitorId);
      throw QueryError.fromError(error as Error, 'ADVANCED_QUERY_ERROR', this.requestId);
    }
  }

  /**
   * Execute find and count query
   */
  public async executeWithCount(): Promise<QueryResult> {
    const context: QueryContext = {
      method: 'findAndCountAll',
      model: this.model,
      options: this.currentOptions,
      startTime: Date.now(),
      requestId: this.requestId,
    };

    const monitorId = this.performanceMonitor.startMonitoring(context);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey('count');
      if (this.cacheManager.isEnabled()) {
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          this.performanceMonitor.recordCacheHit(monitorId);
          return cached;
        }
      }

      // Build query options
      const queryOptions = await this.buildQueryOptions();

      // Execute query
      const startTime = Date.now();
      const result = await (this.model as any).findAndCountAll(queryOptions);
      const executionTime = Date.now() - startTime;

      this.performanceMonitor.recordQueryExecution(monitorId, executionTime);

      const finalResult: QueryResult = {
        data: result.rows,
        count: result.count,
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };

      // Cache result
      if (this.cacheManager.isEnabled()) {
        await this.cacheManager.set(cacheKey, finalResult);
      }

      // Record performance metrics
      const metrics = this.performanceMonitor.endMonitoring(monitorId);
      if (metrics) {
        finalResult.performance = {
          executionTime: metrics.totalExecutionTime,
          queryCount: metrics.queryCount,
          cacheHit: false,
        };
      }

      return finalResult;
    } catch (error) {
      this.performanceMonitor.endMonitoring(monitorId);
      throw QueryError.fromError(error as Error, 'ADVANCED_QUERY_COUNT_ERROR', this.requestId);
    }
  }

  /**
   * Build query options from current configuration
   */
  private async buildQueryOptions(): Promise<any> {
    const options: any = {};

    // Handle pagination
    if (this.currentOptions.pagination) {
      const pagination = this.paginationBuilder.process(this.currentOptions.pagination);
      options.offset = pagination.offset;
      options.limit = pagination.limit;
    }

    // Handle filters
    if (this.currentOptions.filters) {
      const filterResult = this.filterBuilder.processFromOptions(this.currentOptions.filters);
      if (filterResult.errors.length > 0) {
        throw new ValidationError(
          `Filter errors: ${filterResult.errors.join(', ')}`,
          'FILTER_PROCESSING_ERROR',
          undefined,
          this.currentOptions.filters,
          { errors: filterResult.errors },
          this.requestId
        );
      }
      options.where = filterResult.where;
    }

    // Handle sorting
    if (this.currentOptions.sorting) {
      const sortResult = this.sortBuilder.processFromOptions(this.currentOptions.sorting[0]);
      if (sortResult.errors.length > 0) {
        throw new ValidationError(
          `Sort errors: ${sortResult.errors.join(', ')}`,
          'SORT_PROCESSING_ERROR',
          undefined,
          this.currentOptions.sorting,
          { errors: sortResult.errors },
          this.requestId
        );
      }
      options.order = sortResult.order;
    }

    // Handle joins
    if (this.currentOptions.joins) {
      this.joinBuilder.addJoins(this.currentOptions.joins);
      options.include = this.joinBuilder.build();
    }

    // Handle other options
    if (this.currentOptions.attributes) {
      options.attributes = this.currentOptions.attributes;
    }

    if (this.currentOptions.where) {
      options.where = { ...options.where, ...this.currentOptions.where };
    }

    if (this.currentOptions.group) {
      options.group = this.currentOptions.group;
    }

    if (this.currentOptions.having) {
      options.having = this.currentOptions.having;
    }

    if (this.currentOptions.distinct) {
      options.distinct = this.currentOptions.distinct;
    }

    if (this.currentOptions.subQuery !== undefined) {
      options.subQuery = this.currentOptions.subQuery;
    }

    if (this.currentOptions.benchmark !== undefined) {
      options.benchmark = this.currentOptions.benchmark;
    }

    if (this.currentOptions.logging !== undefined) {
      options.logging = this.currentOptions.logging;
    }

    return options;
  }

  /**
   * Get total count for pagination
   */
  private async getTotalCount(queryOptions: any): Promise<number> {
    const countOptions = { ...queryOptions };
    delete countOptions.offset;
    delete countOptions.limit;
    delete countOptions.order;
    delete countOptions.attributes;

    return await (this.model as any).count(countOptions);
  }

  /**
   * Generate cache key for current query
   */
  private generateCacheKey(suffix: string = ''): string {
    const keyParts = [(this.model as any).name, JSON.stringify(this.currentOptions), suffix];
    return this.cacheManager.generateKey('query', ...keyParts);
  }

  /**
   * Reset the query builder
   */
  public reset(): AdvancedQueryBuilder {
    this.currentOptions = {};
    this.filterBuilder.clear();
    this.sortBuilder.clear();
    this.joinBuilder.clear();
    return this;
  }

  /**
   * Get current options
   */
  public getCurrentOptions(): AdvancedQueryOptions {
    return { ...this.currentOptions };
  }

  /**
   * Get pagination builder
   */
  public getPaginationBuilder(): PaginationBuilder {
    return this.paginationBuilder;
  }

  /**
   * Get filter builder
   */
  public getFilterBuilder(): FilterBuilder {
    return this.filterBuilder;
  }

  /**
   * Get sort builder
   */
  public getSortBuilder(): SortBuilder {
    return this.sortBuilder;
  }

  /**
   * Get join builder
   */
  public getJoinBuilder(): JoinBuilder {
    return this.joinBuilder;
  }

  /**
   * Get cache manager
   */
  public getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Get performance monitor
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
}
