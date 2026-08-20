import { IncomingHttpHeaders } from 'http';
import { SearchAPI } from '#app/Search/SearchAPI.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { Aggregations } from '#shared/types/aggregations.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { LibraryFiltersState, LibraryUrlState } from '#V2/Routes/Library/libraryUrlState.js';

type LibrarySearchResult = {
  rows: Entity[];
  totalRows: number;
  aggregations: Aggregations;
};

const NUMERIC_VALUE = /^-?\d+(\.\d+)?$/;

const statusToV1Flags = (status: string[] | undefined) => {
  const values = status ?? [];
  const published = !values.length || values.includes('published');
  const restricted = !values.length || values.includes('restricted');
  return {
    includeUnpublished: published === restricted,
    unpublished: !published && restricted,
  };
};

const toV1FilterValue = (values: string[]) => {
  if (values.length === 2 && values.every(value => NUMERIC_VALUE.test(value))) {
    return { from: Number(values[0]), to: Number(values[1]) };
  }
  if (values.length === 1 && !NUMERIC_VALUE.test(values[0]!)) {
    return { values };
  }
  return { values };
};

const toV1SearchQuery = (
  state: Pick<LibraryUrlState, 'filters' | 'search' | 'from' | 'limit' | 'sort' | 'order'>
) => {
  const { type, status, ...propertyFilters } = state.filters as LibraryFiltersState & {
    type?: string[];
    status?: string[];
  };
  const { includeUnpublished, unpublished } = statusToV1Flags(status);

  const filters: Record<string, unknown> = {};
  Object.entries(propertyFilters).forEach(([key, values]) => {
    if (!values.length) {
      return;
    }
    filters[key] = toV1FilterValue(values);
  });

  return {
    searchTerm: state.search || '',
    ...(type?.length ? { types: type } : {}),
    filters,
    from: state.from,
    limit: state.limit,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(state.order ? { order: state.order } : {}),
    includeUnpublished,
    unpublished,
    aggregatePublishingStatus: true,
  };
};

const searchLibrary = async (
  state: Pick<LibraryUrlState, 'filters' | 'search' | 'from' | 'limit' | 'sort' | 'order'>,
  headers?: IncomingHttpHeaders
): Promise<LibrarySearchResult> => {
  const response = (await SearchAPI.search(new RequestParams(toV1SearchQuery(state), headers))) as {
    rows?: Entity[];
    totalRows?: number;
    aggregations?: Aggregations;
  };

  return {
    rows: response.rows ?? [],
    totalRows: response.totalRows ?? 0,
    aggregations: response.aggregations ?? { all: {} },
  };
};

export { searchLibrary, toV1SearchQuery, statusToV1Flags };
export type { LibrarySearchResult };
