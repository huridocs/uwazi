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
  | string
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
  fields?: string[];
  geolocation?: boolean;
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
  aggregations?: {
    all?: Record<string, RawAggregation>;
  };
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

const usableFilterValues = (values: string[]): string[] =>
  values.map(value => value.trim()).filter(Boolean);

const toEndpointFilterValue = (
  values: string[],
  and = false
): SearchEndpointFilterValue | undefined => {
  const usable = usableFilterValues(values);
  if (!usable.length) {
    return undefined;
  }
  if (usable.length === 2 && usable.every(value => NUMERIC_VALUE.test(value))) {
    return { from: Number(usable[0]), to: Number(usable[1]) };
  }
  if (and) {
    return { values: usable, and: true };
  }
  if (usable.length === 1) {
    return usable[0];
  }
  return { values: usable };
};

const isNestedFilterValue = (
  value: SearchEndpointFilterValue
): value is { properties: Record<string, NestedFilterValue> } =>
  typeof value === 'object' && 'properties' in value;

const setNestedFilter = (
  filters: Record<string, SearchEndpointFilterValue>,
  parent: string,
  child: string,
  values: string[]
) => {
  const current = filters[parent];
  const properties = isNestedFilterValue(current)
    ? { ...current.properties }
    : ({} as Record<string, NestedFilterValue>);
  if (values.length === 1 && values[0] === 'any') {
    properties[child] = { any: true };
  } else {
    const usable = usableFilterValues(values).filter(value => value !== 'any');
    if (!usable.length) {
      return;
    }
    properties[child] = { values: usable };
  }
  filters[parent] = { properties };
};

const projectedFields = (query: LibrarySearchQuery) => {
  if (!query.fields?.length) {
    return undefined;
  }
  if (!query.includeFiles) {
    return query.fields;
  }
  return [...new Set([...query.fields, 'documents', 'attachments'])];
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
    const next = toEndpointFilterValue(values, andKeys.has(key));
    if (next !== undefined) {
      filters[key] = next;
    }
  });
  const fields = projectedFields(query);

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
    ...(fields?.length ? { fields } : {}),
    ...(query.geolocation ? { geolocation: true } : {}),
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
