/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface CompoundFilter {
  values?: string[];
  operator?: 'AND' | 'OR';
}

export interface Page {
  limit?: number;
  offset?: number;
}

export interface RangeFilter {
  from?: number;
  to?: number;
}

export interface SearchQuery {
  page?: Page;
  filter?: {
    searchString?: string;
    sharedId?: string;
    published?: boolean;
    [k: string]: (RangeFilter | CompoundFilter | string | number | boolean) | undefined;
  };
  sort?: string;
  fields?: string[];
}
