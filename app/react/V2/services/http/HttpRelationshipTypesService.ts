import * as relationshipTypesApi from '#V2/api/relationshiptypes/index.js';
import type { RelationshipTypesService } from '../contracts/RelationshipTypesService.js';

const httpRelationshipTypesService: RelationshipTypesService = {
  getAll: async ({ headers } = {}) => relationshipTypesApi.getAll(headers),

  countByTypes: async (ids, { signal } = {}) => [
    await relationshipTypesApi.countByRelationTypes(ids, signal),
  ],

  upsert: async (relationshipType, { headers } = {}) =>
    relationshipTypesApi.upsert(relationshipType, headers),

  delete: async (ids, { headers } = {}) => {
    const results = await Promise.all(
      ids.map(async id => relationshipTypesApi.remove(id, headers))
    );
    const failed = results.find(([, error]) => error);
    if (failed?.[1]) {
      return [undefined as never, failed[1]];
    }
    return [undefined];
  },
};

export { httpRelationshipTypesService };
