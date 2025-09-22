import Joi from 'joi';
import { ValidationError } from '../errors/ValidationError';
import { QueryConfig } from '../types/QueryTypes';

export class ValidationUtils {
  private static readonly defaultSchemas = {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      pageSize: Joi.number().integer().min(1).max(1000).optional(),
      offset: Joi.number().integer().min(0).optional(),
      limit: Joi.number().integer().min(1).max(1000).optional(),
    }),

    filter: Joi.object({
      search: Joi.string().optional(),
      searchFields: Joi.array().items(Joi.string()).optional(),
    }).unknown(true),

    sort: Joi.object({
      column: Joi.string().required(),
      order: Joi.string().valid('ASC', 'DESC').required(),
      nulls: Joi.string().valid('first', 'last').optional(),
      caseSensitive: Joi.boolean().optional(),
    }),

    join: Joi.object({
      model: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
      as: Joi.string().optional(),
      required: Joi.boolean().optional(),
      attributes: Joi.array().items(Joi.string()).optional(),
      where: Joi.object().optional(),
      include: Joi.array().optional(),
    }),
  };

  public static validatePagination(
    options: any,
    _config: Partial<QueryConfig> = {},
    requestId?: string
  ): { isValid: boolean; data?: any; error?: ValidationError } {
    const schema = this.defaultSchemas.pagination;

    const { error, value } = schema.validate(options, { abortEarly: false });

    if (error) {
      return {
        isValid: false,
        error: ValidationError.fromJoiError(error, requestId),
      };
    }

    return { isValid: true, data: value };
  }

  public static validateFilters(
    options: any,
    customSchema?: Joi.ObjectSchema,
    requestId?: string
  ): { isValid: boolean; data?: any; error?: ValidationError } {
    const schema = customSchema || this.defaultSchemas.filter;
    const { error, value } = schema.validate(options, { abortEarly: false });

    if (error) {
      return {
        isValid: false,
        error: ValidationError.fromJoiError(error, requestId),
      };
    }

    return { isValid: true, data: value };
  }

  public static validateSorting(
    options: any,
    allowedColumns?: string[],
    requestId?: string
  ): { isValid: boolean; data?: any; error?: ValidationError } {
    let schema = this.defaultSchemas.sort;

    if (allowedColumns && allowedColumns.length > 0) {
      schema = schema.fork('column', field => field.valid(...allowedColumns));
    }

    const { error, value } = schema.validate(options, { abortEarly: false });

    if (error) {
      return {
        isValid: false,
        error: ValidationError.fromJoiError(error, requestId),
      };
    }

    return { isValid: true, data: value };
  }

  public static validateJoins(
    options: any[],
    allowedModels?: string[],
    requestId?: string
  ): { isValid: boolean; data?: any; error?: ValidationError } {
    let schema = Joi.array().items(this.defaultSchemas.join);

    if (allowedModels && allowedModels.length > 0) {
      // Note: This is a simplified implementation
      // In a real implementation, you would validate against allowed models
    }

    const { error, value } = schema.validate(options, { abortEarly: false });

    if (error) {
      return {
        isValid: false,
        error: ValidationError.fromJoiError(error, requestId),
      };
    }

    return { isValid: true, data: value };
  }

  public static validateConfig(
    config: any,
    requestId?: string
  ): { isValid: boolean; data?: any; error?: ValidationError } {
    const schema = Joi.object({
      defaultPageSize: Joi.number().integer().min(1).max(1000).optional(),
      maxPageSize: Joi.number().integer().min(1).max(10000).optional(),
      enableQueryLogging: Joi.boolean().optional(),
      enableCaching: Joi.boolean().optional(),
      cacheTTL: Joi.number().integer().min(1).optional(),
      enableValidation: Joi.boolean().optional(),
      customValidators: Joi.object().optional(),
      performanceThreshold: Joi.number().integer().min(1).optional(),
      enablePerformanceMonitoring: Joi.boolean().optional(),
      logLevel: Joi.string().valid('debug', 'info', 'warn', 'error').optional(),
      cacheProvider: Joi.string().valid('memory', 'redis').optional(),
      validationSchema: Joi.string().optional(),
    });

    const { error, value } = schema.validate(config, { abortEarly: false });

    if (error) {
      return {
        isValid: false,
        error: ValidationError.fromJoiError(error, requestId),
      };
    }

    return { isValid: true, data: value };
  }

  public static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim();
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  public static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
