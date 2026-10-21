import type { EntitySchema } from '#shared/types/entityType.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import { libraryFacetIcon } from '#V2/services/search/libraryFacetIcon.js';

type LookupAggregationOption = {
  value: string;
  label: string;
  results?: number;
  icon?: EntitySchema['icon'];
};

type LookupAggregationResponse = {
  options: LookupAggregationOption[];
  count: number;
};

type FacetLookupResult = {
  buckets: LibraryFacetBucket[];
  total: number;
};

type FacetLookup = (searchTerm: string) => Promise<FacetLookupResult>;

const bucketsFromLookupOptions = (options: LookupAggregationOption[]): LibraryFacetBucket[] =>
  options.map(option => {
    const icon = libraryFacetIcon(option.icon);
    return {
      id: String(option.value),
      label: option.label,
      count: option.results ?? 0,
      ...(icon ? { icon } : {}),
    };
  });

const lookupAggregation = async (
  property: string,
  searchTerm: string,
  query: Record<string, unknown> = {}
): Promise<FacetLookupResult> => {
  const params = new URLSearchParams({
    property,
    searchTerm,
    query: JSON.stringify(query),
  });
  const response = await fetch(`/api/search/lookupaggregation?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`lookupaggregation failed (${response.status})`);
  }
  const body = (await response.json()) as LookupAggregationResponse;
  return {
    buckets: bucketsFromLookupOptions(body.options ?? []),
    total: body.count ?? body.options?.length ?? 0,
  };
};

export { bucketsFromLookupOptions, lookupAggregation };
export type { FacetLookup, FacetLookupResult, LookupAggregationOption, LookupAggregationResponse };
