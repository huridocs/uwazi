/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface RangeQuery {
  from?: number;
  to?: number;
}

export interface AdvancedQuery {
  values?: string[];
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
  fields?: string[];
}
