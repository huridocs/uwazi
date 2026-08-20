import * as relationshipsQueryApi from '#V2/api/relationships/query.js';
import { formatRelationships } from '#V2/formatters/relationships/formatRelationships.js';
import { mergeRelationshipHubs } from '#V2/formatters/relationships/mergeRelationshipHubs.js';
import type { RelationshipsQueryService } from '../contracts/RelationshipsQueryService.js';

const httpRelationshipsQueryService: RelationshipsQueryService = {
  loadSummary: async (sharedId, { language, headers }) =>
    relationshipsQueryApi.getSummary(sharedId, language, headers),
  loadAnchors: async (sharedId, { language, fileId, headers }) =>
    relationshipsQueryApi.getAnchors(sharedId, fileId, language, headers),
  loadResolved: async (sharedId, { language, headers }) =>
    relationshipsQueryApi.getResolved(sharedId, language, headers),
  compose: (hubs, overlays = {}) =>
    mergeRelationshipHubs(hubs, overlays.anchors ?? [], overlays.resolved ?? []),
  toViews: (sharedId, hubs) => formatRelationships(sharedId, hubs),
};

export { httpRelationshipsQueryService };
