import {
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterResult,
  FilterSchema,
} from '../types/FilterTypes';
// import { ValidationError } from '../errors/ValidationError';

export class FilterProcessor {
  private schema: FilterSchema;

  constructor(schema: FilterSchema = {}) {
    this.schema = schema;
  }

  public process(filters: FilterCondition | FilterGroup | FilterCondition[]): FilterResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let where: any = {};

      if (Array.isArray(filters)) {
        where = this.processFilterArray(filters, errors, warnings);
      } else if ('operator' in filters && 'conditions' in filters) {
        where = this.processFilterGroup(filters, errors, warnings);
      } else {
        where = this.processFilterCondition(filters, errors, warnings);
      }

      return {
        where,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Filter processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        where: {},
        errors,
        warnings,
      };
    }
  }

  private processFilterArray(
    filters: FilterCondition[],
    errors: string[],
    _warnings: string[]
  ): any {
    const conditions = filters.map(filter =>
      this.processFilterCondition(filter, errors, _warnings)
    );
    return { [Op.and]: conditions };
  }

  private processFilterGroup(group: FilterGroup, errors: string[], warnings: string[]): any {
    const conditions = group.conditions.map(condition => {
      if ('operator' in condition && 'conditions' in condition) {
        return this.processFilterGroup(condition, errors, warnings);
      } else {
        return this.processFilterCondition(condition, errors, warnings);
      }
    });

    return { [group.operator === 'and' ? Op.and : Op.or]: conditions };
  }

  private processFilterCondition(
    condition: FilterCondition,
    errors: string[],
    _warnings: string[]
  ): any {
    // Validate the condition
    if (!this.validateCondition(condition)) {
      errors.push(`Invalid filter condition for field: ${condition.field}`);
      return {};
    }

    // Get field schema
    const fieldSchema = this.schema[condition.field];
    if (fieldSchema && !fieldSchema.operators.includes(condition.operator)) {
      errors.push(`Operator '${condition.operator}' not allowed for field '${condition.field}'`);
      return {};
    }

    // Transform value if needed
    let value = condition.value;
    if (fieldSchema?.transform) {
      try {
        value = fieldSchema.transform(value);
      } catch (error) {
        errors.push(
          `Value transformation failed for field '${condition.field}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return {};
      }
    }

    // Process the operator
    return this.processOperator(
      condition.field,
      condition.operator,
      value,
      condition.caseSensitive
    );
  }

  private processOperator(
    field: string,
    operator: FilterOperator,
    value: any,
    _caseSensitive?: boolean
  ): any {
    switch (operator) {
      case 'eq':
        return { [field]: value };
      case 'ne':
        return { [field]: { [Op.ne]: value } };
      case 'gt':
        return { [field]: { [Op.gt]: value } };
      case 'gte':
        return { [field]: { [Op.gte]: value } };
      case 'lt':
        return { [field]: { [Op.lt]: value } };
      case 'lte':
        return { [field]: { [Op.lte]: value } };
      case 'like':
        return { [field]: { [Op.iLike]: value } };
      case 'notLike':
        return { [field]: { [Op.notLike]: value } };
      case 'iLike':
        return { [field]: { [Op.iLike]: value } };
      case 'notILike':
        return { [field]: { [Op.notILike]: value } };
      case 'in':
        return { [field]: { [Op.in]: Array.isArray(value) ? value : [value] } };
      case 'notIn':
        return { [field]: { [Op.notIn]: Array.isArray(value) ? value : [value] } };
      case 'between':
        return {
          [field]: {
            [Op.between]: Array.isArray(value) && value.length === 2 ? value : [value, value],
          },
        };
      case 'notBetween':
        return {
          [field]: {
            [Op.notBetween]: Array.isArray(value) && value.length === 2 ? value : [value, value],
          },
        };
      case 'is':
        return { [field]: { [Op.is]: value } };
      case 'isNot':
        return { [field]: { [Op.not]: value } };
      case 'startsWith':
        return { [field]: { [Op.iLike]: `${value}%` } };
      case 'endsWith':
        return { [field]: { [Op.iLike]: `%${value}` } };
      case 'contains':
        return { [field]: { [Op.iLike]: `%${value}%` } };
      case 'regexp':
        return { [field]: { [Op.regexp]: value } };
      case 'notRegexp':
        return { [field]: { [Op.notRegexp]: value } };
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  private validateCondition(condition: FilterCondition): boolean {
    if (!condition.field || !condition.operator) {
      return false;
    }

    if (condition.value === undefined || condition.value === null) {
      return ['is', 'isNot'].includes(condition.operator);
    }

    return true;
  }

  public setSchema(schema: FilterSchema): void {
    this.schema = schema;
  }

  public getSchema(): FilterSchema {
    return this.schema;
  }
}

// Import Sequelize operators
import { Op } from 'sequelize';
