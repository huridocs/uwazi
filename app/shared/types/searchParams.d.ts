/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface CsvExportParams {
  body?: {
    aggregateGeneratedToc?: boolean;
    aggregatePermissionsByLevel?: boolean;
    aggregatePermissionsByUsers?: boolean;
    aggregatePublishingStatus?: boolean;
    filters?: {
      [k: string]: unknown | undefined;
    };
    customFilters?: {
      generatedToc?: {
        values?: boolean[];
      };
      permissions?: {
        values?: {
          refId?: string;
          level?: string;
        }[];
        and?: boolean;
      };
    };
    types?: string[];
    _types?: string[];
    fields?: string[];
    include?: string[];
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
    select?: string[];
    geolocation?: boolean;
    includeReviewAggregations?: boolean;
    ids?: string[];
  };
  [k: string]: unknown | undefined;
}

export interface SearchParams {
  query?: {
    aggregateGeneratedToc?: boolean;
    aggregatePermissionsByLevel?: boolean;
    aggregatePermissionsByUsers?: boolean;
    aggregatePublishingStatus?: boolean;
    filters?: {
      [k: string]: unknown | undefined;
    };
    customFilters?: {
      generatedToc?: {
        values?: boolean[];
      };
      permissions?: {
        values?: {
          refId?: string;
          level?: string;
        }[];
        and?: boolean;
      };
    };
    types?: string[];
    _types?: string[];
    fields?: string[];
    include?: string[];
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
    select?: string[];
    geolocation?: boolean;
    includeReviewAggregations?: boolean;
  };
  [k: string]: unknown | undefined;
}
