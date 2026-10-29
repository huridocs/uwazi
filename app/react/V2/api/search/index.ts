import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { SearchQuery } from '#shared/types/SearchQueryType.js';
import { EntityResponse, EntitySearchResponse, SnippetsSearchResponse } from '../types.js';

const finitePageNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
};

const searchResultTotal = (
  links: { last?: string | null } | undefined,
  rowCount: number
): number => {
  const { page } = qs.parse(links?.last?.split('?')[1] ?? '');
  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    return rowCount;
  }
  const { offset, limit } = page;
  const offsetNumber = finitePageNumber(offset);
  const limitNumber = finitePageNumber(limit);
  if (offsetNumber === undefined || limitNumber === undefined) {
    return rowCount;
  }
  return Math.max(rowCount, offsetNumber + limitNumber);
};

const lookup = async (
  {
    entityTitle,
    template,
    limit = 10,
    offset,
  }: {
    entityTitle: string;
    template?: string;
    limit?: number;
    offset?: number;
  },
  headers?: IncomingHttpHeaders
): Promise<EntityResponse> => {
  try {
    const searchQuery: SearchQuery = {
      fields: ['title', 'sharedId', 'template'],
      filter: {
        ...(entityTitle && { searchString: `title:${entityTitle}~2` }),
        ...(template && { template }),
      },
      page: { limit, ...(offset ? { offset } : {}) },
    };

    const requestParams = new RequestParams(qs.stringify(searchQuery), headers);

    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }

    const response: { json: EntitySearchResponse } = await api.get('v2/search', requestParams);
    return {
      rows: response.json.data,
      count: searchResultTotal(response.json.links, response.json.data.length),
    };
  } catch (e) {
    return e;
  }
};

const search = async (
  {
    filters,
    fields,
    limit = 10,
  }: { filters: SearchQuery['filter']; fields: SearchQuery['fields']; limit?: number },
  headers?: IncomingHttpHeaders
): Promise<EntityResponse> => {
  try {
    const searchQuery: SearchQuery = {
      fields,
      filter: filters,
      page: { limit },
    };
    const requestParams = new RequestParams(qs.stringify(searchQuery), headers);

    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }

    const response: { json: EntitySearchResponse } = await api.get('v2/search', requestParams);
    return { rows: response.json.data, count: response.json.data.length };
  } catch (e) {
    return e;
  }
};

const snippets = async (
  {
    sharedId,
    searchString,
    limit = 10,
  }: { sharedId: string; searchString: string; limit?: number },
  headers?: IncomingHttpHeaders
): Promise<SnippetsSearchResponse> => {
  try {
    const searchQuery: SearchQuery = {
      fields: ['snippets'],
      filter: {
        ...(sharedId && { sharedId }),
        ...(searchString && { searchString }),
      },
      page: { limit },
    };

    const requestParams = new RequestParams(qs.stringify(searchQuery), headers);

    if (headers && headers['Content-Language']) {
      api.locale(headers['Content-Language']);
    }

    const response: { json: SnippetsSearchResponse } = await api.get('v2/search', requestParams);
    return response.json;
  } catch (e) {
    return e;
  }
};

export { lookup, search, searchResultTotal, snippets };
