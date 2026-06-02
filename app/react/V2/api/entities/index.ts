import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import { api } from '#app/utils/api.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { SearchQuery, CompoundFilter } from '#shared/types/SearchQueryType.js';
import { EntitySearchResponse } from '../types.js';
import * as formatter from './formatter.js';
import { ApiResponse } from '../ApiResponse.js';
import { Entity } from './types.js';

const getById = async ({
  _id,
  language,
  omitRelationships = true,
}: {
  _id: string;
  language: string;
  omitRelationships?: boolean;
}): Promise<ApiResponse<Entity | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams({
      _id,
      omitRelationships,
    });

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    if (response.length) {
      return [response[0]];
    }
    return [undefined];
  } catch (e) {
    return [undefined, e];
  }
};

const getBySharedId = async (
  {
    sharedId,
    language,
    omitRelationships = true,
  }: { sharedId: string; language: string; omitRelationships?: boolean },
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Entity[] | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams(
      {
        sharedId,
        omitRelationships,
      },
      headers
    );

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    return [response];
  } catch (e) {
    return [undefined, e];
  }
};

const update = async (
  entity: Entity
): Promise<ApiResponse<Entity | undefined, FetchResponseError>> => {
  try {
    const requestParams = new RequestParams(entity);
    const { json: response } = await api.post('entities', requestParams);
    return [response];
  } catch (e) {
    return [undefined, e];
  }
};

const coerceValue = async (
  value: string | Date,
  type: string,
  locale: string
): Promise<{ success: string; value: number }> => {
  try {
    const requestParams = new RequestParams({
      locale,
      value,
      type,
    });
    const { json: response } = await api.post('entities/coerce_value', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

// eslint-disable-next-line max-statements
const searchByTitle = async (
  {
    title,
    fields = ['title', 'sharedId', 'template'],
    template,
    limit,
    includeFiles = false,
  }: {
    title: string;
    fields?: string[];
    template?: string[];
    limit?: number;
    includeFiles?: boolean;
  },
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Entity[] | undefined, FetchResponseError>> => {
  try {
    const finalFields = includeFiles
      ? [...new Set([...fields, 'documents', 'attachments'])]
      : fields;

    const filter: SearchQuery['filter'] = {
      searchString: `title:${title}~2`,
    };

    if (template && template.length > 0) {
      const templateFilter: CompoundFilter = {
        values: template,
        operator: 'OR',
      };
      filter.template = templateFilter;
    }

    const searchQuery: SearchQuery = {
      fields: finalFields,
      filter,
      ...(limit && { page: { limit } }),
    };

    const requestParams = new RequestParams(qs.stringify(searchQuery), headers);

    const response: { json: EntitySearchResponse } = await api.get('v2/search', requestParams);
    const searchResults = response.json.data;

    if (searchResults.length === 0) {
      return [undefined, undefined];
    }

    return [searchResults as Entity[], undefined];
  } catch (e) {
    return [undefined, e];
  }
};

export { getById, update, coerceValue, formatter, getBySharedId, searchByTitle };
