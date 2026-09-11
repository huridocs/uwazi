import type { IXModelsRow } from '#api/services/informationextraction/infrastructure/PostgresIXModelsRow.js';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { sanitizeForJsonb } from './FilesMigrationConfig.js';

/**
 * Copies `ixmodels` into `ix_models`. Ids arrive as ObjectIds from Mongo and as hex strings from
 * mirrored test fixtures; `String()` yields the hex form of both. Models whose extractor is gone
 * are skipped: nothing deletes them in Mongo (F13) and the foreign key rejects them.
 */
export const IXModelsMigrationConfig: MigrationConfig = {
  mongoCollection: 'ixmodels',
  pgTable: 'ix_models',
  excludeOrphansOf: { field: 'extractorId', collection: 'ixextractors' },
  mapDocument(doc: Record<string, unknown>): IXModelsRow {
    return {
      _id: String(doc._id),
      extractorId: String(doc.extractorId),
      creationDate: (doc.creationDate as number | undefined) ?? null,
      status: (doc.status as string | undefined) ?? 'processing',
      findingSuggestions: (doc.findingSuggestions as boolean | undefined) ?? true,
      maxSuggestionsToFind: (doc.maxSuggestionsToFind as number | undefined) ?? null,
      totalSuggestionsToFind: (doc.totalSuggestionsToFind as number | undefined) ?? null,
      processRun: (sanitizeForJsonb(doc.processRun) as IXModelsRow['processRun']) ?? null,
    };
  },
};
