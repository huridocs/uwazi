/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface RangeQuery {
  from?: number;
  to?: number;
}

export interface SearchQuery {
  page?: {
    limit?: number;
  };
  filter?: {
    searchString?: string;
    sharedId?: string;
    published?: boolean;
    [k: string]: (RangeQuery | string | number | boolean) | undefined;
  };
  fields?: string[];
}
