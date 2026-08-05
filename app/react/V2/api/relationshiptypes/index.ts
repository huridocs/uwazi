import type { IncomingHttpHeaders } from 'http';
import type {
  RelationshipType,
  RelationshipTypeInput,
} from '#shared/contracts/RelationshipType.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import { apiClient } from '#V2/api/client.js';

const requestHeaders = (headers?: IncomingHttpHeaders): Record<string, string> | undefined => {
  const mapped = Object.fromEntries(
    Object.entries(headers ?? {}).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === 'string';
    })
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const isRelationshipType = (value: unknown): value is RelationshipType =>
  typeof value === 'object' &&
  value !== null &&
  '_id' in value &&
  typeof (value as { _id: unknown })._id === 'string' &&
  'name' in value &&
  typeof (value as { name: unknown }).name === 'string';

const getAll = async (headers?: IncomingHttpHeaders): Promise<ApiResponse<RelationshipType[]>> => {
  const [data, error] = await apiClient.getJson<{ rows: RelationshipType[] }>(
    'relationtypes',
    {},
    { headers: requestHeaders(headers) }
  );

  if (error) {
    return [undefined as never, error];
  }

  return [data?.rows ?? []];
};

const upsert = async (
  relationshipType: RelationshipTypeInput,
  headers?: IncomingHttpHeaders
): Promise<ApiResponse<RelationshipType>> => {
  const [data, error] = await apiClient.postJson<RelationshipType>(
    'relationtypes',
    relationshipType,
    {
      headers: requestHeaders(headers),
    }
  );

  if (error) {
    return [undefined as never, error];
  }

  if (isRelationshipType(data)) {
    return [data];
  }

  return [undefined as never];
};

const remove = async (id: string, headers?: IncomingHttpHeaders): Promise<ApiResponse<void>> => {
  const [, error] = await apiClient.deleteJson(
    'relationtypes',
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

export { getAll, upsert, remove };
