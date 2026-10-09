import type { IncomingHttpHeaders } from 'http';
import type { Template, TemplateInput } from '#shared/contracts/Template.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import { apiClient } from '#V2/api/client.js';
import { requestHeaders } from '#V2/api/requestHeaders.js';

const isTemplate = (value: unknown): value is Template =>
  typeof value === 'object' &&
  value !== null &&
  '_id' in value &&
  typeof (value as { _id: unknown })._id === 'string' &&
  'name' in value &&
  typeof (value as { name: unknown }).name === 'string';

const getAll = async (headers?: IncomingHttpHeaders): Promise<ApiResponse<Template[]>> => {
  const [data, error] = await apiClient.getJson<{ rows: Template[] }>(
    'templates',
    {},
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined as never, error];
  }

  return [data?.rows ?? []];
};

const getById = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Template | undefined>> => {
  const [templates, error] = await getAll(headers);
  if (error) {
    return [undefined, error];
  }
  return [templates.find(template => template._id === id)];
};

const upsert = async (
  template: TemplateInput,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Template>> => {
  const [data, error] = await apiClient.postJson<Template>('templates', template, {
    headers: requestHeaders(headers),
  });

  if (error) {
    return [undefined as never, error];
  }

  if (isTemplate(data)) {
    return [data];
  }

  return [undefined as never];
};

const remove = async (id: string, headers?: IncomingHttpHeaders): Promise<ApiResponse<void>> => {
  const [, error] = await apiClient.deleteJson(
    'templates',
    { _id: id },
    {
      headers: requestHeaders(headers),
    }
  );

  if (error) {
    return [undefined as never, error];
  }

  return [undefined];
};

const setDefault = async (
  id: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Template>> => {
  const [data, error] = await apiClient.postJson<Template>(
    'templates/setasdefault',
    { _id: id },
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined as never, error];
  }

  if (isTemplate(data)) {
    return [data];
  }

  return [undefined as never];
};

type CountPayload = number | { value: number };

const readCount = (count: CountPayload | undefined): number =>
  typeof count === 'number' ? count : (count?.value ?? 0);

const checkEntityCounts = async (
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Record<string, number>>> =>
  apiClient.getJson<Record<string, number>>(
    'v2/entities/count_by_template',
    {},
    { headers: requestHeaders(headers) }
  );

const checkEntityCount = async (
  templateId: string,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<number>> => {
  const [count, error] = await apiClient.getJson<CountPayload>(
    'v2/entities/count_by_template',
    { templateId },
    { headers: requestHeaders(headers) }
  );
  if (error) return [undefined as never, error];
  return [readCount(count)];
};

export { getAll, getById, upsert, remove, setDefault, checkEntityCounts, checkEntityCount };
