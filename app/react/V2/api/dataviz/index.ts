import { IncomingHttpHeaders } from 'http';
import { api } from '#app/utils/api.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import type { DatavizDefinition } from '#shared/types/datavizSchema.js';
import type { DatavizDataDTO, DatavizPublicEmbedDTO } from '#shared/types/datavizSchema.js';
import { FetchResponseError } from '#shared/JSONRequest.js';

export type DatavizCreateInput = Omit<DatavizDefinition, 'id' | 'createdAt' | 'updatedAt'>;

const list = async (headers?: IncomingHttpHeaders): Promise<DatavizDefinition[]> => {
  try {
    const response = await api.get('dataviz', new RequestParams({}, headers));
    return response.json.rows ?? [];
  } catch (e) {
    return e;
  }
};

const getById = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<DatavizDefinition | FetchResponseError> => {
  try {
    const response = await api.get(`dataviz/${id}`, new RequestParams({}, headers));
    return response.json;
  } catch (e) {
    return e;
  }
};

const create = async (
  input: DatavizCreateInput,
  headers?: IncomingHttpHeaders
): Promise<DatavizDefinition | FetchResponseError> => {
  try {
    const response = await api.post('dataviz', new RequestParams(input, headers));
    return response.json;
  } catch (e) {
    return e;
  }
};

const update = async (
  definition: DatavizDefinition,
  headers?: IncomingHttpHeaders
): Promise<DatavizDefinition | FetchResponseError> => {
  try {
    const response = await api.put(
      `dataviz/${definition.id}`,
      new RequestParams(definition, headers)
    );
    return response.json;
  } catch (e) {
    return e;
  }
};

const remove = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<void | FetchResponseError> => {
  try {
    await api.delete(`dataviz/${id}`, new RequestParams({}, headers));
  } catch (e) {
    return e;
  }
};

const preview = async (
  id: string,
  query: DatavizDefinition['query'],
  headers?: IncomingHttpHeaders
): Promise<DatavizDataDTO | FetchResponseError> => {
  try {
    const response = await api.post(
      `dataviz/${id}/preview`,
      new RequestParams({ query }, headers)
    );
    return response.json;
  } catch (e) {
    return e;
  }
};

const refreshSnapshot = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<DatavizDataDTO | FetchResponseError> => {
  try {
    const response = await api.post(`dataviz/${id}/refresh`, new RequestParams({}, headers));
    return response.json;
  } catch (e) {
    return e;
  }
};

const getPublicEmbedData = async (
  id: string,
  locale?: string,
  headers?: IncomingHttpHeaders
): Promise<DatavizPublicEmbedDTO | FetchResponseError> => {
  try {
    const response = await api.get(
      `public/dataviz/${id}/data`,
      new RequestParams(locale ? { locale } : {}, {
        ...headers,
        ...(locale ? { 'Content-Language': locale } : {}),
      })
    );
    return response.json;
  } catch (e) {
    return e;
  }
};

export { list, getById, create, update, remove, preview, refreshSnapshot, getPublicEmbedData };
