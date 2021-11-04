/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface RangeQuery {
  from?: number;
  to?: number;
}

export interface AdvancedQuery {
  values?: string[];
  operator?: 'AND' | 'OR';
}

export interface SearchQuery {
  page?: {
    limit?: number;
  };
  filter?: {
    searchString?: string;
    sharedId?: string;
    published?: boolean;
    [k: string]: (RangeQuery | AdvancedQuery | string | number | boolean) | undefined;
  };
  sort?: string;
  fields?: string[];
}
