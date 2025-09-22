// import { Request, Response, NextFunction } from 'express';
import { ValidationUtils } from '../utils/ValidationUtils';
import { ValidationError } from '../errors/ValidationError';
import { QueryConfig } from '../types/QueryTypes';

export interface ValidationMiddlewareOptions {
  config?: Partial<QueryConfig>;
  customValidators?: Record<string, any>;
  strictMode?: boolean;
}

export class ValidationMiddleware {
  private config: Partial<QueryConfig>;
  private customValidators: Record<string, any>;
  private strictMode: boolean;

  constructor(options: ValidationMiddlewareOptions = {}) {
    this.config = options.config || {};
    this.customValidators = options.customValidators || {};
    this.strictMode = options.strictMode || false;
  }

  /**
   * Validate pagination parameters
   */
  public validatePagination() {
    return (req: any, res: any, next: any): void => {
      try {
        const { page, pageSize, offset, limit } = req.query;

        if (page || pageSize || offset || limit) {
          const paginationOptions = {
            page: page ? parseInt(page as string, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
          };

          const validation = ValidationUtils.validatePagination(
            paginationOptions,
            this.config,
            req.headers['x-request-id'] as string
          );

          if (!validation.isValid && validation.error) {
            return this.handleValidationError(res, validation.error);
          }

          req.query = { ...req.query, ...validation.data };
        }

        next();
      } catch (error) {
        this.handleError(res, error);
      }
    };
  }

  /**
   * Validate filter parameters
   */
  public validateFilters() {
    return (req: any, res: any, next: any): void => {
      try {
        const filters = req.query;

        if (Object.keys(filters).length > 0) {
          const validation = ValidationUtils.validateFilters(
            filters,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!validation.isValid && validation.error) {
            return this.handleValidationError(res, validation.error);
          }

          req.query = validation.data;
        }

        next();
      } catch (error) {
        this.handleError(res, error);
      }
    };
  }

  /**
   * Validate sort parameters
   */
  public validateSorting() {
    return (req: any, res: any, next: any): void => {
      try {
        const { sort, order, column } = req.query;

        if (sort || order || column) {
          const sortOptions = {
            column: (sort as string) || (column as string),
            order: (order as string) || 'ASC',
          };

          const validation = ValidationUtils.validateSorting(
            sortOptions,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!validation.isValid && validation.error) {
            return this.handleValidationError(res, validation.error);
          }

          req.query = { ...req.query, ...validation.data };
        }

        next();
      } catch (error) {
        this.handleError(res, error);
      }
    };
  }

  /**
   * Validate join parameters
   */
  public validateJoins() {
    return (req: any, res: any, next: any): void => {
      try {
        const { include, joins } = req.query;

        if (include || joins) {
          const joinOptions = JSON.parse((include as string) || (joins as string) || '[]');

          const validation = ValidationUtils.validateJoins(
            joinOptions,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!validation.isValid && validation.error) {
            return this.handleValidationError(res, validation.error);
          }

          req.query = { ...req.query, joins: validation.data };
        }

        next();
      } catch (error) {
        this.handleError(res, error);
      }
    };
  }

  /**
   * Validate all query parameters
   */
  public validateAll() {
    return (req: any, res: any, next: any): void => {
      try {
        const { page, pageSize, offset, limit, sort, order, column, include, joins, ...filters } =
          req.query;

        // Validate pagination
        if (page || pageSize || offset || limit) {
          const paginationOptions = {
            page: page ? parseInt(page as string, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
          };

          const paginationValidation = ValidationUtils.validatePagination(
            paginationOptions,
            this.config,
            req.headers['x-request-id'] as string
          );

          if (!paginationValidation.isValid && paginationValidation.error) {
            return this.handleValidationError(res, paginationValidation.error);
          }
        }

        // Validate sorting
        if (sort || order || column) {
          const sortOptions = {
            column: (sort as string) || (column as string),
            order: (order as string) || 'ASC',
          };

          const sortValidation = ValidationUtils.validateSorting(
            sortOptions,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!sortValidation.isValid && sortValidation.error) {
            return this.handleValidationError(res, sortValidation.error);
          }
        }

        // Validate joins
        if (include || joins) {
          const joinOptions = JSON.parse((include as string) || (joins as string) || '[]');

          const joinValidation = ValidationUtils.validateJoins(
            joinOptions,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!joinValidation.isValid && joinValidation.error) {
            return this.handleValidationError(res, joinValidation.error);
          }
        }

        // Validate filters
        if (Object.keys(filters).length > 0) {
          const filterValidation = ValidationUtils.validateFilters(
            filters,
            undefined,
            req.headers['x-request-id'] as string
          );

          if (!filterValidation.isValid && filterValidation.error) {
            return this.handleValidationError(res, filterValidation.error);
          }
        }

        next();
      } catch (error) {
        this.handleError(res, error);
      }
    };
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(res: any, error: ValidationError): void {
    res.status(400).json({
      error: true,
      type: 'ValidationError',
      message: error.message,
      code: error.code,
      field: error.field,
      value: error.value,
      details: error.details,
      timestamp: error.timestamp,
      requestId: error.requestId,
    });
  }

  /**
   * Handle general errors
   */
  private handleError(res: any, error: any): void {
    res.status(500).json({
      error: true,
      type: 'InternalServerError',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set configuration
   */
  public setConfig(config: Partial<QueryConfig>): void {
    this.config = config;
  }

  /**
   * Set custom validators
   */
  public setCustomValidators(validators: Record<string, any>): void {
    this.customValidators = validators;
  }

  /**
   * Set strict mode
   */
  public setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * Get configuration
   */
  public getConfig(): Partial<QueryConfig> {
    return this.config;
  }

  /**
   * Get custom validators
   */
  public getCustomValidators(): Record<string, any> {
    return this.customValidators;
  }

  /**
   * Check if strict mode is enabled
   */
  public isStrictMode(): boolean {
    return this.strictMode;
  }
}
