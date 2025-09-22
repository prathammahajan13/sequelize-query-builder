import { Model, WhereOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { QueryBuilderOptions, QueryResult } from '../types/QueryTypes';
import { QueryError } from '../errors/QueryError';
import { ValidationUtils } from '../utils/ValidationUtils';

export class BasicQueryBuilder {
  protected model: Model;
  protected config: any;
  protected requestId: string;

  constructor(options: QueryBuilderOptions) {
    this.model = options.model;
    this.config = options.config || {};
    this.requestId = ValidationUtils.generateRequestId();
  }

  /**
   * Find all records matching the given conditions
   */
  public async findAll(where?: WhereOptions, options?: any): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).findAll({
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: result,
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'FIND_ALL_ERROR', this.requestId);
    }
  }

  /**
   * Find a single record matching the given conditions
   */
  public async findOne(where?: WhereOptions, options?: any): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).findOne({
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: result ? [result] : [],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'FIND_ONE_ERROR', this.requestId);
    }
  }

  /**
   * Find a record by its primary key
   */
  public async findByPk(id: any, options?: any): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).findByPk(id, options);

      const executionTime = Date.now() - startTime;

      return {
        data: result ? [result] : [],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'FIND_BY_PK_ERROR', this.requestId);
    }
  }

  /**
   * Find and count all records matching the given conditions
   */
  public async findAndCountAll(where?: WhereOptions, options?: any): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).findAndCountAll({
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: result.rows,
        count: result.count,
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'FIND_AND_COUNT_ALL_ERROR', this.requestId);
    }
  }

  /**
   * Count records matching the given conditions
   */
  public async count(where?: WhereOptions, options?: any): Promise<number> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).count({
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      if (this.config.enableQueryLogging) {
        console.log(`Count query executed in ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      throw QueryError.fromError(error as Error, 'COUNT_ERROR', this.requestId);
    }
  }

  /**
   * Create a new record
   */
  public async create(data: any, options?: CreateOptions): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).create(data, options);

      const executionTime = Date.now() - startTime;

      return {
        data: [result],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'CREATE_ERROR', this.requestId);
    }
  }

  /**
   * Create multiple records
   */
  public async bulkCreate(data: any[], options?: any): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const result = await (this.model as any).bulkCreate(data, options);

      const executionTime = Date.now() - startTime;

      return {
        data: result,
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'BULK_CREATE_ERROR', this.requestId);
    }
  }

  /**
   * Update records matching the given conditions
   */
  public async update(
    data: any,
    where?: WhereOptions,
    options?: UpdateOptions
  ): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const [affectedCount] = await (this.model as any).update(data, {
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: [{ affectedCount }],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'UPDATE_ERROR', this.requestId);
    }
  }

  /**
   * Update a record by its primary key
   */
  public async updateByPk(id: any, data: any, options?: UpdateOptions): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const [affectedCount] = await (this.model as any).update(data, {
        where: { [(this.model as any).primaryKeyAttribute]: id },
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: [{ affectedCount }],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'UPDATE_BY_PK_ERROR', this.requestId);
    }
  }

  /**
   * Delete records matching the given conditions
   */
  public async destroy(where?: WhereOptions, options?: DestroyOptions): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const affectedCount = await (this.model as any).destroy({
        where,
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: [{ affectedCount }],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'DESTROY_ERROR', this.requestId);
    }
  }

  /**
   * Delete a record by its primary key
   */
  public async destroyByPk(id: any, options?: DestroyOptions): Promise<QueryResult> {
    try {
      const startTime = Date.now();

      const affectedCount = await (this.model as any).destroy({
        where: { [(this.model as any).primaryKeyAttribute]: id },
        ...options,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: [{ affectedCount }],
        performance: {
          executionTime,
          queryCount: 1,
          cacheHit: false,
        },
      };
    } catch (error) {
      throw QueryError.fromError(error as Error, 'DESTROY_BY_PK_ERROR', this.requestId);
    }
  }

  /**
   * Check if a record exists
   */
  public async exists(where?: WhereOptions): Promise<boolean> {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (error) {
      throw QueryError.fromError(error as Error, 'EXISTS_ERROR', this.requestId);
    }
  }

  /**
   * Get the model instance
   */
  public getModel(): Model {
    return this.model;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): any {
    return this.config;
  }

  /**
   * Get the current request ID
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
}
