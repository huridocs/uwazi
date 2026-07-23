import relationtypes from '#api/relationtypes/relationtypes.js';
import type { RelationshipType } from '#shared/contracts/RelationshipType.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { RelationshipTypesService } from '../contracts/RelationshipTypesService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { notImplemented } from './notImplemented.js';
import type { ServerServiceContext } from './types.js';

/** Mongo ObjectIds → strings, matching HTTP JSON serialization. */
const serializeRows = (rows: unknown[]): RelationshipType[] => JSON.parse(JSON.stringify(rows));

const createServerRelationshipTypesService = (
  _ctx: ServerServiceContext
): RelationshipTypesService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<RelationshipType[]>> => {
    try {
      const rows = await relationtypes.get();
      return [serializeRows(rows), undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<RelationshipType>(),

  delete: async () => notImplemented<void>(),
});

export { createServerRelationshipTypesService };
