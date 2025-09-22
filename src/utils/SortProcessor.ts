import { SortCondition, SortResult, SortSchema } from '../types/SortTypes';
// import { ValidationError } from '../errors/ValidationError';

export class SortProcessor {
  private schema: SortSchema;

  constructor(schema: SortSchema = {}) {
    this.schema = schema;
  }

  public process(sorts: SortCondition | SortCondition[]): SortResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let order: any[] = [];

      if (Array.isArray(sorts)) {
        order = this.processSortArray(sorts, errors, warnings);
      } else {
        order = this.processSortCondition(sorts, errors, warnings);
      }

      return {
        order,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Sort processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        order: [],
        errors,
        warnings,
      };
    }
  }

  private processSortArray(sorts: SortCondition[], errors: string[], _warnings: string[]): any[] {
    return sorts.map(sort => this.processSortCondition(sort, errors, _warnings)).filter(Boolean);
  }

  private processSortCondition(
    condition: SortCondition,
    errors: string[],
    _warnings: string[]
  ): any {
    // Validate the condition
    if (!this.validateCondition(condition)) {
      errors.push(`Invalid sort condition for column: ${condition.column}`);
      return null;
    }

    // Get column schema
    const columnSchema = this.schema[condition.column];
    if (columnSchema && !columnSchema.allowed) {
      errors.push(`Column '${condition.column}' is not allowed for sorting`);
      return null;
    }

    // Use default order if not specified
    const order = condition.order || columnSchema?.defaultOrder || 'ASC';

    // Build the sort expression
    let sortExpression: any = condition.column;

    // Handle case sensitivity
    if (condition.caseSensitive === false || columnSchema?.caseSensitive === false) {
      sortExpression = this.sequelize.fn('LOWER', this.sequelize.col(condition.column));
    }

    // Handle nulls placement
    const nulls = condition.nulls || columnSchema?.nulls;
    if (nulls) {
      sortExpression = [sortExpression, nulls === 'first' ? 'NULLS FIRST' : 'NULLS LAST'];
    }

    return [sortExpression, order];
  }

  private validateCondition(condition: SortCondition): boolean {
    if (!condition.column) {
      return false;
    }

    if (condition.order && !['ASC', 'DESC'].includes(condition.order)) {
      return false;
    }

    if (condition.nulls && !['first', 'last'].includes(condition.nulls)) {
      return false;
    }

    return true;
  }

  public setSchema(schema: SortSchema): void {
    this.schema = schema;
  }

  public getSchema(): SortSchema {
    return this.schema;
  }

  // This will be injected by the query builder
  private sequelize: any;

  public setSequelize(sequelize: any): void {
    this.sequelize = sequelize;
  }
}
