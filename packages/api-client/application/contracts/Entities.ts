import type { EntitySchema } from '#shared/types/entityType.js';

/** GET /api/entities — pass typed values; over HTTP they arrive JSON-encoded per key. */
type EntityQuery = {
  sharedId?: string;
  _id?: string;
  omitRelationships?: boolean;
  includeMetadataRelationships?: boolean;
  include?: ('permissions' | 'translations')[];
};

/** One row on success; `{ rows: [] }` comes back as a 404 ServerApiError. */
type EntitiesResponse = { rows: EntitySchema[] };

export type { EntityQuery, EntitiesResponse };
