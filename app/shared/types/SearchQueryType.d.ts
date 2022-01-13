/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface Page {
  limit?: number;
  offset?: number;
}

export interface RangeQuery {
  from?: number;
  to?: number;
}

export interface AdvancedQuery {
  values?: string[];
  operator?: 'AND' | 'OR';
}

export interface SearchQuery {
  page?: Page;
  filter?: {
    searchString?: string;
    sharedId?: string;
    published?: boolean;
    [k: string]: (RangeQuery | AdvancedQuery | string | number | boolean) | undefined;
  };
  sort?: string;
  fields?: string[];
}
