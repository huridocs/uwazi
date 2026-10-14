import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

const asText = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/**
 * Entries keep their Mongo id. `expireAt` is dropped: in Postgres a tenant's log is bounded by how
 * many entries it holds, not by their age. Old entries may lack any of the request details.
 */
export const ActivityLogsMigrationConfig: MigrationConfig = {
  mongoCollection: 'activitylogs',
  pgTable: 'activitylogs',
  conflictColumns: ['tenant_id', '_id'],
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      method: doc.method,
      url: doc.url,
      params: asText(doc.params),
      query: asText(doc.query),
      body: asText(doc.body),
      user_id: doc.user ? String(doc.user) : null,
      username: doc.username ?? null,
      time: doc.time,
    };
  },
};
