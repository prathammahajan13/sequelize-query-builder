// Core query builders
export { BasicQueryBuilder } from './builders/BasicQueryBuilder';
export { AdvancedQueryBuilder } from './builders/AdvancedQueryBuilder';
export { PaginationBuilder } from './builders/PaginationBuilder';
export { FilterBuilder } from './builders/FilterBuilder';
export { SortBuilder } from './builders/SortBuilder';
export { JoinBuilder } from './builders/JoinBuilder';

// Utilities
export { ValidationUtils } from './utils/ValidationUtils';
export { FilterProcessor } from './utils/FilterProcessor';
export { SortProcessor } from './utils/SortProcessor';
export { PerformanceMonitor } from './utils/PerformanceMonitor';
export { CacheManager, MemoryCacheProvider } from './utils/CacheManager';

// Middleware
export { ValidationMiddleware } from './middleware/ValidationMiddleware';
export { LoggingMiddleware } from './middleware/LoggingMiddleware';
export { CacheMiddleware } from './middleware/CacheMiddleware';

// Error classes
export { QueryError } from './errors/QueryError';
export { ValidationError } from './errors/ValidationError';
export { PaginationError } from './errors/PaginationError';

// Types
export * from './types/QueryTypes';
export {
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterProcessor as FilterProcessorType,
  FilterSchema,
  FilterResult,
} from './types/FilterTypes';
export {
  SortCondition,
  SortOrder,
  SortProcessor as SortProcessorType,
  SortSchema,
  SortResult,
} from './types/SortTypes';
export {
  PaginationConfig,
  CursorPaginationOptions,
  CursorPaginationResult,
  PaginationProcessor,
} from './types/PaginationTypes';

// Main factory function
import { Model } from 'sequelize';
import { BasicQueryBuilder } from './builders/BasicQueryBuilder';
import { AdvancedQueryBuilder } from './builders/AdvancedQueryBuilder';
import { QueryBuilderOptions, QueryConfig } from './types/QueryTypes';

/**
 * Create a basic query builder instance
 */
export function createBasicQueryBuilder(options: QueryBuilderOptions): BasicQueryBuilder {
  return new BasicQueryBuilder(options);
}

/**
 * Create an advanced query builder instance
 */
export function createAdvancedQueryBuilder(options: QueryBuilderOptions): AdvancedQueryBuilder {
  return new AdvancedQueryBuilder(options);
}

/**
 * Create a query builder with default configuration
 */
export function createQueryBuilder(
  model: Model,
  config?: Partial<QueryConfig>
): AdvancedQueryBuilder {
  return new AdvancedQueryBuilder({
    model,
    config: {
      defaultPageSize: 10,
      maxPageSize: 100,
      enableQueryLogging: true,
      enableCaching: false,
      cacheTTL: 300,
      enableValidation: true,
      customValidators: {},
      performanceThreshold: 1000,
      enablePerformanceMonitoring: true,
      logLevel: 'info',
      cacheProvider: 'memory',
      validationSchema: 'default',
      ...config,
    },
  });
}

/**
 * Default configuration
 */
export const defaultConfig: QueryConfig = {
  defaultPageSize: 10,
  maxPageSize: 100,
  enableQueryLogging: true,
  enableCaching: false,
  cacheTTL: 300,
  enableValidation: true,
  customValidators: {},
  performanceThreshold: 1000,
  enablePerformanceMonitoring: true,
  logLevel: 'info',
  cacheProvider: 'memory',
  validationSchema: 'default',
};

/**
 * Version information
 */
export const version = '1.0.0';

/**
 * Package information
 */
export const packageInfo = {
  name: '@prathammahajan/sequelize-query-builder',
  version: '1.0.0',
  description: 'Advanced Sequelize query builder with pagination, filtering, and sorting',
  author: 'Your Organization',
  license: 'MIT',
};
