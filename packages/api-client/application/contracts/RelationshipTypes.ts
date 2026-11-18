import type { RelationshipType } from '#shared/contracts/RelationshipType.js';

/** GET /api/relationtypes */
type RelationshipTypesResponse = { rows: RelationshipType[] };

export type { RelationshipTypesResponse };
