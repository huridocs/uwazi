import { IncomingHttpHeaders } from 'http';
import qs from 'qs';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { SearchQuery, CompoundFilter } from '#shared/types/SearchQueryType.js';
import { apiClient } from '../client.js';
import { EntitySearchResponse } from '../types.js';
import { ApiResponse } from '../ApiResponse.js';
import * as formatter from './formatter.js';
import { Entity } from './types.js';
import { saveWithFiles } from './save/index.js';

const requestHeaders = (headers?: IncomingHttpHeaders): Record<string, string> | undefined => {
  const mapped = Object.fromEntries(
    Object.entries(headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const withLanguage = (language: string, headers?: IncomingHttpHeaders) => ({
  ...requestHeaders(headers),
  'Content-Language': language,
});

const isEntity = (value: unknown): value is Entity =>
  typeof value === 'object' &&
  value !== null &&
  '_id' in value &&
  typeof (value as { _id: unknown })._id === 'string' &&
  'sharedId' in value &&
  typeof (value as { sharedId: unknown }).sharedId === 'string';

const getById = async ({
  _id,
  language,
  omitRelationships = true,
  headers,
}: {
  _id: string;
  language: string;
  omitRelationships?: boolean;
  headers?: IncomingHttpHeaders;
}): Promise<ApiResponse<Entity | undefined>> => {
  const [data, error] = await apiClient.getJson<{ rows: Entity[] }>(
    'entities',
    { _id, omitRelationships },
    { headers: withLanguage(language, headers), language }
  );

  if (error) {
    return [undefined, error];
  }

  const row = data?.rows?.find(isEntity);
  if (row) {
    return [row];
  }

  return [undefined];
};

const getBySharedId = async (
  {
    sharedId,
    language,
    omitRelationships = true,
  }: { sharedId: string; language: string; omitRelationships?: boolean },
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Entity[] | undefined>> => {
  const [data, error] = await apiClient.getJson<{ rows: Entity[] }>(
    'entities',
    { sharedId, omitRelationships },
    { headers: withLanguage(language, headers), language }
  );

  if (error) {
    return [undefined, error];
  }

  const rows = data?.rows?.filter(isEntity);
  return rows?.length ? [rows] : [undefined];
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
): Promise<ApiResponse<Entity[] | undefined>> => {
  const finalFields = includeFiles ? [...new Set([...fields, 'documents', 'attachments'])] : fields;

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

  const [data, error] = await apiClient.getJson<EntitySearchResponse>(
    'v2/search',
    qs.stringify(searchQuery),
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined, error];
  }

  if (!data?.data?.length) {
    return [undefined, undefined];
  }

  const rows = data.data.filter(isEntity);
  if (!rows.length) {
    return [undefined, undefined];
  }

  return [rows];
};

const create = async (
  { title, template }: { title: string; template: string },
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Entity | undefined>> => {
  const [data, error] = await apiClient.postJson<{ entity?: Entity } | Entity>(
    'entities',
    { title, template },
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined, error];
  }

  if (data && typeof data === 'object' && 'entity' in data && isEntity(data.entity)) {
    return [data.entity];
  }

  if (isEntity(data)) {
    return [data];
  }

  return [undefined];
};

const remove = async (
  sharedIds: string[],
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<void>> => {
  const requestHeadersMapped = requestHeaders(headers);

  if (sharedIds.length === 1) {
    const [, error] = await apiClient.deleteJson(
      'entities',
      { sharedId: sharedIds[0] },
      { headers: requestHeadersMapped }
    );
    if (error) return [undefined, error];
    return [undefined];
  }

  const [, error] = await apiClient.postJson(
    'entities/bulkdelete',
    { sharedIds },
    { headers: requestHeadersMapped }
  );
  if (error) return [undefined, error];
  return [undefined];
};

export {
  getById,
  update,
  create,
  coerceValue,
  formatter,
  getBySharedId,
  searchByTitle,
  saveWithFiles,
  remove,
};
