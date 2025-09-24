import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/SearchQuery... Remove this comment to see the full error message
import { SearchQuery } from 'shared/types/SearchQueryType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';

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
): Promise<Response> => {
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

    const response: { json: SearchResponse } = await api.get('v2/search', requestParams);
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
) => {
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

    const response: { json: SearchResponse } = await api.get('v2/search', requestParams);
    return { rows: response.json.data, count: response.json.data.length };
  } catch (e) {
    return e;
  }
};

export { lookup, search };
