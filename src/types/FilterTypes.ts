export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'notLike'
  | 'iLike'
  | 'notILike'
  | 'in'
  | 'notIn'
  | 'between'
  | 'notBetween'
  | 'is'
  | 'isNot'
  | 'and'
  | 'or'
  | 'not'
  | 'startsWith'
  | 'endsWith'
  | 'contains'
  | 'regexp'
  | 'notRegexp';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  caseSensitive?: boolean;
}

export interface FilterGroup {
  operator: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
}

export interface FilterChain {
  filters: (FilterCondition | FilterGroup)[];
  operator?: 'and' | 'or';
}

export interface FilterProcessor {
  process(condition: FilterCondition): any;
  validate(condition: FilterCondition): boolean;
}

export interface FilterSchema {
  [field: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    operators: FilterOperator[];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      enum?: any[];
    };
    transform?: (value: any) => any;
  };
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  [key: string]: any;
}

export interface FilterResult {
  where: any;
  errors: string[];
  warnings: string[];
}
