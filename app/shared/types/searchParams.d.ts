/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface SearchParams {
  query?: {
    aggregateGeneratedToc?: boolean;
    filters?: {
      [k: string]: unknown | undefined;
    };
    customFilters?: {
      generatedToc?: {
        values?: [] | [boolean];
      };
    };
    types?: [] | [string];
    _types?: [] | [string];
    fields?: [] | [string];
    allAggregations?: boolean;
    aggregations?: string;
    order?: 'asc' | 'desc';
    sort?: string;
    limit?: number;
    from?: number;
    searchTerm?: string | number;
    includeUnpublished?: boolean;
    userSelectedSorting?: boolean;
    treatAs?: string;
    unpublished?: boolean;
    select?: [] | [string];
    geolocation?: boolean;
  };
  [k: string]: unknown | undefined;
}
