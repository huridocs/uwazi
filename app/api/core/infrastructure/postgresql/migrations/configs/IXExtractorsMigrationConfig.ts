import type { IXExtractorsRow } from '#api/services/informationextraction/infrastructure/PostgresIXExtractorsRow.js';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { sanitizeForJsonb } from './FilesMigrationConfig.js';

/**
 * Copies `ixextractors` into `ix_extractors`. Ids arrive as ObjectIds from Mongo and as hex
 * strings from mirrored test fixtures; `String()` yields the hex form of both.
 */
export const IXExtractorsMigrationConfig: MigrationConfig = {
  mongoCollection: 'ixextractors',
  pgTable: 'ix_extractors',
  mapDocument(doc: Record<string, unknown>): IXExtractorsRow {
    return {
      _id: String(doc._id),
      name: doc.name as string,
      property: doc.property as string,
      source: sanitizeForJsonb(doc.source) as IXExtractorsRow['source'],
      templates: ((doc.templates as unknown[] | undefined) ?? []).map(String),
    };
  },
};
