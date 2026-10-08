import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { sanitizeForJsonb } from './FilesMigrationConfig.js';

/**
 * Copies `dataviz_snapshots` into `dataviz_snapshots`. A snapshot's `_id` is its `datavizId`.
 */
export const DatavizSnapshotsMigrationConfig: MigrationConfig = {
  mongoCollection: 'dataviz_snapshots',
  pgTable: 'dataviz_snapshots',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      datavizId: String(doc.datavizId),
      queryHash: doc.queryHash,
      payload: sanitizeForJsonb(doc.payload),
      generatedAt: new Date(doc.generatedAt as number),
    };
  },
};
