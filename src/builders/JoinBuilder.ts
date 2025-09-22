import { Model, Includeable } from 'sequelize';
import { JoinOptions } from '../types/QueryTypes';
import { QueryError } from '../errors/QueryError';
import { ValidationUtils } from '../utils/ValidationUtils';

export class JoinBuilder {
  private model: Model;
  private joins: JoinOptions[] = [];
  private requestId: string;

  constructor(model: Model, requestId?: string) {
    this.model = model;
    this.requestId = requestId || ValidationUtils.generateRequestId();
  }

  /**
   * Add a join to the query
   */
  public addJoin(join: JoinOptions): JoinBuilder {
    this.validateJoin(join);
    this.joins.push(join);
    return this;
  }

  /**
   * Add multiple joins to the query
   */
  public addJoins(joins: JoinOptions[]): JoinBuilder {
    joins.forEach(join => this.addJoin(join));
    return this;
  }

  /**
   * Add a join by model name
   */
  public joinModel(modelName: string, options?: Partial<JoinOptions>): JoinBuilder {
    const join: JoinOptions = {
      model: modelName,
      ...options,
    };
    return this.addJoin(join);
  }

  /**
   * Add a join by model instance
   */
  public joinModelInstance(model: Model, options?: Partial<JoinOptions>): JoinBuilder {
    const join: JoinOptions = {
      model,
      ...options,
    };
    return this.addJoin(join);
  }

  /**
   * Add a required join (INNER JOIN)
   */
  public requiredJoin(join: JoinOptions): JoinBuilder {
    return this.addJoin({ ...join, required: true });
  }

  /**
   * Add an optional join (LEFT JOIN)
   */
  public optionalJoin(join: JoinOptions): JoinBuilder {
    return this.addJoin({ ...join, required: false });
  }

  /**
   * Add a join with specific attributes
   */
  public joinWithAttributes(join: JoinOptions, attributes: string[]): JoinBuilder {
    return this.addJoin({ ...join, attributes });
  }

  /**
   * Add a join with where conditions
   */
  public joinWithWhere(join: JoinOptions, where: any): JoinBuilder {
    return this.addJoin({ ...join, where });
  }

  /**
   * Add a nested join
   */
  public addNestedJoin(join: JoinOptions, nestedJoins: JoinOptions[]): JoinBuilder {
    const nestedInclude = this.buildInclude(nestedJoins);
    return this.addJoin({ ...join, include: nestedInclude });
  }

  /**
   * Build the include array for Sequelize
   */
  public build(): Includeable[] {
    return this.joins.map(join => this.buildInclude([join])[0]).filter(Boolean) as Includeable[];
  }

  /**
   * Build include options for a single join
   */
  private buildInclude(joins: JoinOptions[]): Includeable[] {
    return joins.map(join => {
      const include: any = {
        model: join.model as any,
        ...(join.required !== undefined && { required: join.required }),
        ...(join.attributes && { attributes: join.attributes }),
        ...(join.where && { where: join.where }),
      };

      if (join.as) {
        include.as = join.as;
      }

      if (join.include && join.include.length > 0) {
        include.include = join.include;
      }

      return include;
    });
  }

  /**
   * Validate a join option
   */
  private validateJoin(join: JoinOptions): void {
    if (!join.model) {
      throw new QueryError(
        'Join model is required',
        'INVALID_JOIN_MODEL',
        { join },
        this.requestId
      );
    }

    if (join.attributes && !Array.isArray(join.attributes)) {
      throw new QueryError(
        'Join attributes must be an array',
        'INVALID_JOIN_ATTRIBUTES',
        { join },
        this.requestId
      );
    }

    if (join.include && !Array.isArray(join.include)) {
      throw new QueryError(
        'Join include must be an array',
        'INVALID_JOIN_INCLUDE',
        { join },
        this.requestId
      );
    }
  }

  /**
   * Get all joins
   */
  public getJoins(): JoinOptions[] {
    return [...this.joins];
  }

  /**
   * Clear all joins
   */
  public clear(): JoinBuilder {
    this.joins = [];
    return this;
  }

  /**
   * Get join count
   */
  public getJoinCount(): number {
    return this.joins.length;
  }

  /**
   * Check if joins exist
   */
  public hasJoins(): boolean {
    return this.joins.length > 0;
  }

  /**
   * Get joins by model name
   */
  public getJoinsByModel(modelName: string): JoinOptions[] {
    return this.joins.filter(join => {
      if (typeof join.model === 'string') {
        return join.model === modelName;
      }
      return (join.model as any).name === modelName;
    });
  }

  /**
   * Remove joins by model name
   */
  public removeJoinsByModel(modelName: string): JoinBuilder {
    this.joins = this.joins.filter(join => {
      if (typeof join.model === 'string') {
        return join.model !== modelName;
      }
      return (join.model as any).name !== modelName;
    });
    return this;
  }

  /**
   * Check if a model is already joined
   */
  public hasModel(modelName: string): boolean {
    return this.getJoinsByModel(modelName).length > 0;
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
   * Clone the join builder
   */
  public clone(): JoinBuilder {
    const cloned = new JoinBuilder(this.model, this.requestId);
    cloned.joins = [...this.joins];
    return cloned;
  }

  /**
   * Merge with another join builder
   */
  public merge(other: JoinBuilder): JoinBuilder {
    this.joins.push(...other.getJoins());
    return this;
  }

  /**
   * Get join statistics
   */
  public getStats(): {
    totalJoins: number;
    requiredJoins: number;
    optionalJoins: number;
    models: string[];
  } {
    const requiredJoins = this.joins.filter(join => join.required === true).length;
    const optionalJoins = this.joins.filter(join => join.required === false).length;
    const models = this.joins.map(join => {
      return typeof join.model === 'string' ? join.model : (join.model as any).name;
    });

    return {
      totalJoins: this.joins.length,
      requiredJoins,
      optionalJoins,
      models: [...new Set(models)],
    };
  }
}
