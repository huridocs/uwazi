import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const SyncsMigrationConfig: MigrationConfig = {
  mongoCollection: 'syncs',
  pgTable: 'syncs',
  conflictColumns: ['tenant_id', 'name'],
  mapDocument(doc: Record<string, unknown>) {
    const { lastSyncs } = doc;
    return {
      name: String(doc.name),
      last_syncs: lastSyncs !== null && typeof lastSyncs === 'object' ? lastSyncs : {},
      consecutive_failures: Number(doc.consecutiveFailures ?? 0),
    };
  },
};
