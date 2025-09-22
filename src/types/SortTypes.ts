export type SortOrder = 'ASC' | 'DESC';

export interface SortCondition {
  column: string;
  order: SortOrder;
  nulls?: 'first' | 'last';
  caseSensitive?: boolean;
}

export interface SortChain {
  sorts: SortCondition[];
  priority?: number;
}

export interface SortProcessor {
  process(condition: SortCondition): any;
  validate(condition: SortCondition): boolean;
}

export interface SortSchema {
  [column: string]: {
    allowed: boolean;
    defaultOrder?: SortOrder;
    nulls?: 'first' | 'last';
    caseSensitive?: boolean;
    transform?: (value: any) => any;
  };
}

export interface SortOptions {
  column?: string;
  order?: SortOrder;
  nulls?: 'first' | 'last';
  caseSensitive?: boolean;
}

export interface SortResult {
  order: any;
  errors: string[];
  warnings: string[];
}
