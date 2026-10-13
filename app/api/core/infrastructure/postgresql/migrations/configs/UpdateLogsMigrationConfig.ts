import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

export const UpdateLogsMigrationConfig: MigrationConfig = {
  mongoCollection: 'updatelogs',
  pgTable: 'updatelogs',
  conflictColumns: ['tenant_id', 'id'],
  mapDocument(doc: Record<string, unknown>) {
    const id = doc.mongoId instanceof ObjectId ? doc.mongoId.toHexString() : String(doc.mongoId);
    return {
      id,
      namespace: doc.namespace,
      timestamp: doc.timestamp,
      deleted: Boolean(doc.deleted),
    };
  },
};
