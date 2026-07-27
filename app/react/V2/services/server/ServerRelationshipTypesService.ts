import { GetRelationshipTypesUseCaseFactory } from '#api/relationshiptypes.v2/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import type { RelationshipType } from '#shared/contracts/RelationshipType.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { RelationshipTypesService } from '../contracts/RelationshipTypesService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

const serializeRows = (rows: { id: string; name: string }[]): RelationshipType[] =>
  rows.map(row => ({ _id: row.id, name: row.name }));

const createServerRelationshipTypesService = (
  _ctx: ServerServiceContext
): RelationshipTypesService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<RelationshipType[]>> => {
    try {
      const rows = await GetRelationshipTypesUseCaseFactory.default().execute({});
      return [serializeRows(rows), undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<RelationshipType>(),

  delete: async () => notImplemented<void>(),
});

export { createServerRelationshipTypesService };
