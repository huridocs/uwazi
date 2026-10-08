import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { sanitizeForJsonb } from './FilesMigrationConfig.js';

const optional = (value: unknown) => (value === undefined ? null : value);

const optionalJsonb = (value: unknown) => (value === undefined ? null : sanitizeForJsonb(value));

/**
 * Copies `dataviz` into `dataviz`. Ids arrive as ObjectIds from Mongo and as hex strings from
 * mirrored test fixtures; `String()` yields the hex form of both. Timestamps are epoch millis.
 */
export const DatavizMigrationConfig: MigrationConfig = {
  mongoCollection: 'dataviz',
  pgTable: 'dataviz',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      name: doc.name,
      description: optional(doc.description),
      dataSource: optional(doc.dataSource),
      query: sanitizeForJsonb(doc.query),
      manualData: optionalJsonb(doc.manualData),
      chart: sanitizeForJsonb(doc.chart),
      appearance: sanitizeForJsonb(doc.appearance),
      refresh: sanitizeForJsonb(doc.refresh),
      processing: optionalJsonb(doc.processing),
      embedPublic: doc.embedPublic ?? false,
      createdAt: new Date(doc.createdAt as number),
      updatedAt: new Date(doc.updatedAt as number),
    };
  },
};
