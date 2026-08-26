import type { Aggregations } from '#shared/types/aggregations.js';
import type {
  LibraryAggregations,
  LibraryFacetBucket,
  LibraryPublishedStatus,
  LibrarySearchQuery,
  LibrarySearchResult,
} from '#shared/types/librarySearch.js';

const NUMERIC_VALUE = /^-?\d+(\.\d+)?$/;

const HIDDEN_AGGREGATION_KEYS = new Set([
  '_types',
  '_published',
  'generatedToc',
  '_permissions.self',
  '_permissions.read',
  '_permissions.write',
]);

type V1SearchQuery = {
  searchTerm: string;
  types?: string[];
  filters: Record<string, { values: string[] } | { from: number; to: number }>;
  from?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeUnpublished: boolean;
  unpublished: boolean;
  aggregatePublishingStatus: true;
};

type V1SearchResult = {
  rows?: LibrarySearchResult['rows'];
  totalRows?: number;
  aggregations?: Aggregations;
};

const statusToV1Flags = (status: LibraryPublishedStatus | undefined) => {
  if (status === 'published') {
    return { includeUnpublished: false, unpublished: false };
  }
  if (status === 'restricted') {
    return { includeUnpublished: false, unpublished: true };
  }
  return { includeUnpublished: true, unpublished: false };
};

const toV1FilterValue = (values: string[]) => {
  if (values.length === 2 && values.every(value => NUMERIC_VALUE.test(value))) {
    return { from: Number(values[0]), to: Number(values[1]) };
  }
  return { values };
};

const toV1SearchQuery = (query: LibrarySearchQuery): V1SearchQuery => {
  const { includeUnpublished, unpublished } = statusToV1Flags(query.publishedStatus);
  const filters: V1SearchQuery['filters'] = {};
  Object.entries(query.filters ?? {}).forEach(([key, values]) => {
    if (values.length) {
      filters[key] = toV1FilterValue(values);
    }
  });

  return {
    searchTerm: query.searchTerm || '',
    ...(query.templateIds?.length ? { types: query.templateIds } : {}),
    filters,
    from: query.from,
    limit: query.limit,
    ...(query.sort ? { sort: query.sort } : {}),
    ...(query.order ? { order: query.order } : {}),
    includeUnpublished,
    unpublished,
    aggregatePublishingStatus: true,
  };
};

const bucketCount = (buckets: Aggregations['all'][string]['buckets'] | undefined, key: string) =>
  buckets?.find(bucket => String(bucket.key) === key)?.filtered?.doc_count ?? 0;

const toFacetBuckets = (
  buckets: Aggregations['all'][string]['buckets'] | undefined
): LibraryFacetBucket[] =>
  (buckets ?? [])
    .filter(bucket => bucket.key !== 'missing')
    .map(bucket => ({
      id: String(bucket.key),
      label: bucket.label,
      count: bucket.filtered?.doc_count ?? 0,
    }));

const fromV1SearchResult = (response: V1SearchResult): LibrarySearchResult => {
  const all = response.aggregations?.all ?? {};
  const properties: LibraryAggregations['properties'] = {};
  Object.entries(all).forEach(([key, aggregation]) => {
    if (HIDDEN_AGGREGATION_KEYS.has(key) || !aggregation?.buckets?.length) {
      return;
    }
    properties[key] = toFacetBuckets(aggregation.buckets);
  });

  return {
    rows: response.rows ?? [],
    totalRows: response.totalRows ?? 0,
    aggregations: {
      templates: toFacetBuckets(all._types?.buckets),
      published: {
        published: bucketCount(all._published?.buckets, 'true'),
        restricted: bucketCount(all._published?.buckets, 'false'),
      },
      properties,
    },
  };
};

export { fromV1SearchResult, toV1SearchQuery };
export type { V1SearchQuery, V1SearchResult };
