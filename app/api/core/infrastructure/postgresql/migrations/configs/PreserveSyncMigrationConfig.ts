import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

const requiredText = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`preserveSync document is missing ${field}`);
  }
  return value;
};

export const PreserveSyncMigrationConfig: MigrationConfig = {
  mongoCollection: 'preservesyncs',
  pgTable: 'preserve_sync',
  conflictColumns: ['tenant_id', 'token'],
  mapDocument(doc: Record<string, unknown>) {
    return {
      token: requiredText(doc.token, 'token'),
      last_import: requiredText(doc.lastImport, 'lastImport'),
    };
  },
};
