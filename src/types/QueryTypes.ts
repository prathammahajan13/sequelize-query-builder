import { Model, WhereOptions, Order, Includeable } from 'sequelize';

export interface QueryConfig {
  defaultPageSize: number;
  maxPageSize: number;
  enableQueryLogging: boolean;
  enableCaching: boolean;
  cacheTTL: number;
  enableValidation: boolean;
  customValidators: Record<string, any>;
  performanceThreshold: number;
  enablePerformanceMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheProvider: 'memory' | 'redis';
  validationSchema: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
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
  };
}

export interface FilterOptions {
  [key: string]: any;
}

export interface SortOptions {
  column: string;
  order: 'ASC' | 'DESC';
}

export interface JoinOptions {
  model: string | Model;
  as?: string;
  required?: boolean;
  attributes?: string[];
  where?: WhereOptions;
  include?: Includeable[];
}

export interface QueryBuilderOptions {
  model: Model;
  config?: Partial<QueryConfig>;
}

export interface AdvancedQueryOptions {
  pagination?: PaginationOptions;
  filters?: FilterOptions;
  sorting?: SortOptions[];
  joins?: JoinOptions[];
  attributes?: string[];
  where?: WhereOptions;
  order?: Order;
  include?: Includeable[];
  group?: string[];
  having?: WhereOptions;
  distinct?: boolean;
  subQuery?: boolean;
  benchmark?: boolean;
  logging?: boolean;
}

export interface QueryResult<T = any> {
  data: T[];
  count?: number;
  pagination?: PaginationResult['pagination'];
  performance?: {
    executionTime: number;
    queryCount: number;
    cacheHit: boolean;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface CacheOptions {
  key: string;
  ttl?: number;
  tags?: string[];
}

export interface PerformanceMetrics {
  queryExecutionTime: number;
  totalExecutionTime: number;
  memoryUsage: number;
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
}

export type QueryMethod =
  | 'findAll'
  | 'findOne'
  | 'findAndCountAll'
  | 'count'
  | 'create'
  | 'update'
  | 'destroy';

export interface QueryContext {
  method: QueryMethod;
  model: Model;
  options: AdvancedQueryOptions;
  startTime: number;
  requestId: string;
}
