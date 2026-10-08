import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

const toIdString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  return value instanceof ObjectId ? value.toHexString() : String(value);
};

export const PXEntitiesStatusMigrationConfig: MigrationConfig = {
  mongoCollection: 'px_entities_status',
  pgTable: 'px_entities_status',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: toIdString(doc._id),
      entitySharedId: doc.entitySharedId,
      extractorId: toIdString(doc.extractorId),
      status: doc.status,
    };
  },
  excludeOrphansOf: { field: 'extractorId', collection: 'px_extractors' },
};
