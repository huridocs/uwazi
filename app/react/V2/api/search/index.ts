import { IncomingHttpHeaders } from 'http';
import qs from 'qs';

import api from '#app/utils/api.js';

import { RequestParams } from '#app/utils/RequestParams.js';

import { SearchQuery } from '#shared/types/SearchQueryType.js';

import { EntitySchema } from '#shared/types/entityType.js';

type SearchResponse = {
  data: (Required<Pick<EntitySchema, 'title' | 'sharedId' | 'template'>> & { _id: string })[];
  links?: {
    self: string;
    first?: string | null;
    last?: string | null;
    next?: string | null;
    prev?: string | null;
  };
};

type Response = {
  rows: SearchResponse['data'];
  count: number;
};

const lookup = async (
  {
    entityTitle,
    template,
    limit = 10,
  }: {
    entityTitle: string;
    template?: string;
    limit?: number;
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

export { lookup, search, snippets };
