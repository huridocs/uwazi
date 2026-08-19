import * as relationshipsQueryApi from '#V2/api/relationships/query.js';
import type { RelationshipsQueryService } from '../contracts/RelationshipsQueryService.js';

const httpRelationshipsQueryService: RelationshipsQueryService = {
  getSummary: async (sharedId, { language, headers }) =>
    relationshipsQueryApi.getSummary(sharedId, language, headers),
  getAnchors: async (sharedId, fileId, { language, headers }) =>
    relationshipsQueryApi.getAnchors(sharedId, fileId, language, headers),
  getResolved: async (sharedId, { language, headers }) =>
    relationshipsQueryApi.getResolved(sharedId, language, headers),
};

export { httpRelationshipsQueryService };
