import type { IncomingHttpHeaders } from 'http';
import type { Thesaurus, ThesaurusInput } from '#shared/contracts/Thesaurus.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import { apiClient } from '#V2/api/client.js';
import { requestHeaders } from '#V2/api/requestHeaders.js';

const isThesaurus = (value: unknown): value is Thesaurus =>
  typeof value === 'object' &&
  value !== null &&
  '_id' in value &&
  typeof (value as { _id: unknown })._id === 'string' &&
  'name' in value &&
  typeof (value as { name: unknown }).name === 'string';

const getAll = async (headers?: IncomingHttpHeaders): Promise<ApiResponse<Thesaurus[]>> => {
  const [data, error] = await apiClient.getJson<{ rows: Thesaurus[] }>(
    'dictionaries',
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
): Promise<ApiResponse<Thesaurus | undefined>> => {
  const [data, error] = await apiClient.getJson<{ rows: Thesaurus[] }>(
    'dictionaries',
    { _id: id },
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined, error];
  }

  return [data?.rows?.find(isThesaurus)];
};

const upsert = async (
  thesaurus: ThesaurusInput,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Thesaurus>> => {
  const [data, error] = await apiClient.postJson<Thesaurus>('thesauris', thesaurus, {
    headers: requestHeaders(headers),
  });

  if (error) {
    return [undefined as never, error];
  }

  if (isThesaurus(data)) {
    return [data];
  }

  return [undefined as never];
};

const remove = async (id: string, headers?: IncomingHttpHeaders): Promise<ApiResponse<void>> => {
  const [, error] = await apiClient.deleteJson(
    'thesauris',
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

const importFromFile = async (
  thesaurus: ThesaurusInput,
  file: File,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<Thesaurus>> =>
  apiClient.postMultipart<Thesaurus>(
    'thesauris',
    {
      fields: [{ name: 'thesauri', value: JSON.stringify(thesaurus) }],
      files: [{ name: 'file', file, filename: file.name }],
    },
    { headers: requestHeaders(headers) }
  );

export { getAll, getById, upsert, remove, importFromFile };
