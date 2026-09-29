import type { IXSuggestionsRow } from '#api/suggestions/infrastructure/PostgresIXSuggestionsRow.js';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';
import { sanitizeForJsonb } from './FilesMigrationConfig.js';

const isAbsent = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

const idOrNull = (value: unknown) => (isAbsent(value) ? null : String(value));

const textOrNull = (value: unknown) =>
  isAbsent(value) ? null : (sanitizeForJsonb(value) as string);

const jsonbOrNull = <T>(value: unknown) =>
  isAbsent(value) ? null : (sanitizeForJsonb(value) as T);

/**
 * `suggestedValue` and `currentValue` are usually plain strings. Both row writers bind a string
 * as it is, which a JSONB column rejects as invalid JSON, so these two go in as JSON text.
 */
const jsonText = (value: unknown) => JSON.stringify(sanitizeForJsonb(value));

/**
 * Copies `ixsuggestions` into `ix_suggestions`. Ids arrive as ObjectIds from Mongo and as hex
 * strings from mirrored test fixtures; `String()` yields the hex form of both. `status` and
 * `useForTraining` get the defaults the mongoose schema applied on insert. Suggestions whose
 * extractor is gone are skipped: the foreign key rejects them.
 */
export const IXSuggestionsMigrationConfig: MigrationConfig = {
  mongoCollection: 'ixsuggestions',
  pgTable: 'ix_suggestions',
  excludeOrphansOf: { field: 'extractorId', collection: 'ixextractors' },
  mapDocument(doc: Record<string, unknown>): IXSuggestionsRow {
    return {
      _id: String(doc._id),
      extractorId: String(doc.extractorId),
      entityId: textOrNull(doc.entityId)!,
      entityLanguageId: idOrNull(doc.entityLanguageId),
      entityTemplate: String(doc.entityTemplate),
      entityTitle: textOrNull(doc.entityTitle),
      fileId: idOrNull(doc.fileId),
      propertyName: textOrNull(doc.propertyName)!,
      language: textOrNull(doc.language)!,
      suggestedValue: jsonText(doc.suggestedValue ?? ''),
      suggestedText: textOrNull(doc.suggestedText),
      currentValue: isAbsent(doc.currentValue) ? null : jsonText(doc.currentValue),
      segment: textOrNull(doc.segment),
      selectionRectangles: jsonbOrNull(doc.selectionRectangles),
      status: (doc.status as string | undefined) ?? 'processing',
      error: textOrNull(doc.error),
      date: (doc.date as number | null | undefined) ?? null,
      state: jsonbOrNull(doc.state),
      modelData: jsonbOrNull(doc.modelData),
      useForTraining: (doc.useForTraining as boolean | undefined) ?? false,
      trainingSample: (doc.trainingSample as boolean | null | undefined) ?? null,
    };
  },
};
