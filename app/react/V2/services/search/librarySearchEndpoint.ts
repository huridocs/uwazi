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

type NestedFilterValue = { values?: string[]; any?: boolean };

type SearchEndpointFilterValue =
  | { values: string[]; and?: boolean }
  | { from: number; to: number }
  | { properties: Record<string, NestedFilterValue> };

type SearchEndpointQuery = {
  searchTerm: string;
  types?: string[];
  filters: Record<string, SearchEndpointFilterValue>;
  from?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeUnpublished: boolean;
  unpublished: boolean;
  aggregatePublishingStatus: true;
  include: ['permissions'];
};

type RawBucket = {
  key: string | number;
  label?: string;
  filtered?: {
    doc_count?: number;
    total?: { filtered?: { doc_count?: number } };
  };
  values?: RawBucket[];
};

type RawAggregation = {
  type?: string;
  buckets?: RawBucket[];
  [key: string]: unknown;
};

type SearchEndpointResult = {
  rows?: LibrarySearchResult['rows'];
  totalRows?: number;
  aggregations?: Aggregations;
};

const statusToEndpointFlags = (status: LibraryPublishedStatus | undefined) => {
  if (status === 'published') {
    return { includeUnpublished: false, unpublished: false };
  }
  if (status === 'restricted') {
    return { includeUnpublished: false, unpublished: true };
  }
  return { includeUnpublished: true, unpublished: false };
};

const toEndpointFilterValue = (values: string[], and = false): SearchEndpointFilterValue => {
  if (values.length === 2 && values.every(value => NUMERIC_VALUE.test(value))) {
    return { from: Number(values[0]), to: Number(values[1]) };
  }
  return and ? { values, and: true } : { values };
};

const setNestedFilter = (
  filters: Record<string, SearchEndpointFilterValue>,
  parent: string,
  child: string,
  values: string[]
) => {
  const current = filters[parent];
  const properties =
    current && 'properties' in current
      ? { ...current.properties }
      : ({} as Record<string, NestedFilterValue>);
  if (values.length === 1 && values[0] === 'any') {
    properties[child] = { any: true };
  } else {
    properties[child] = { values: values.filter(value => value !== 'any') };
  }
  filters[parent] = { properties };
};

const toSearchEndpointQuery = (query: LibrarySearchQuery): SearchEndpointQuery => {
  const { includeUnpublished, unpublished } = statusToEndpointFlags(query.publishedStatus);
  const andKeys = new Set(query.andFilters ?? []);
  const filters: Record<string, SearchEndpointFilterValue> = {};
  Object.entries(query.filters ?? {}).forEach(([key, values]) => {
    if (!values.length) {
      return;
    }
    const separator = key.indexOf('.');
    if (separator > 0) {
      setNestedFilter(filters, key.slice(0, separator), key.slice(separator + 1), values);
      return;
    }
    filters[key] = toEndpointFilterValue(values, andKeys.has(key));
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
    include: ['permissions'],
  };
};

const bucketDocCount = (bucket: RawBucket) =>
  bucket.filtered?.doc_count ?? bucket.filtered?.total?.filtered?.doc_count ?? 0;

const bucketCount = (buckets: RawBucket[] | undefined, key: string) =>
  buckets?.find(bucket => String(bucket.key) === key)?.filtered?.doc_count ?? 0;

const toFacetBuckets = (buckets: RawBucket[] | undefined): LibraryFacetBucket[] =>
  (buckets ?? [])
    .filter(bucket => bucket.key !== 'missing' && bucketDocCount(bucket) > 0)
    .map(bucket => {
      const values = bucket.values ? toFacetBuckets(bucket.values) : undefined;
      return {
        id: String(bucket.key),
        label: bucket.label,
        count: bucketDocCount(bucket),
        ...(values?.length ? { values } : {}),
      };
    });

const nestedGroupsFromParent = (aggregation: RawAggregation): LibraryFacetBucket[] => {
  const groups: LibraryFacetBucket[] = [];
  Object.entries(aggregation).forEach(([subKey, value]) => {
    if (subKey === 'type' || subKey === 'doc_count' || subKey === 'meta' || subKey === 'buckets') {
      return;
    }
    const nested = value as RawAggregation | undefined;
    if (!nested?.buckets?.length) {
      return;
    }
    const values = toFacetBuckets(nested.buckets);
    if (!values.length) {
      return;
    }
    groups.push({
      id: subKey,
      label: subKey,
      count: values.reduce((sum, bucket) => sum + bucket.count, 0),
      values,
    });
  });
  return groups;
};

const fromSearchEndpointResult = (response: SearchEndpointResult): LibrarySearchResult => {
  const all = (response.aggregations?.all ?? {}) as Record<string, RawAggregation>;
  const properties: LibraryAggregations['properties'] = {};
  Object.entries(all).forEach(([key, aggregation]) => {
    if (HIDDEN_AGGREGATION_KEYS.has(key) || aggregation.type === 'nested') {
      return;
    }
    if (aggregation.buckets?.length) {
      const buckets = toFacetBuckets(aggregation.buckets);
      if (buckets.length) {
        properties[key] = buckets;
      }
      return;
    }
    const nested = nestedGroupsFromParent(aggregation);
    if (nested.length) {
      properties[key] = nested;
    }
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

export { fromSearchEndpointResult, toSearchEndpointQuery };
export type { SearchEndpointQuery, SearchEndpointResult };
