import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

/**
 * Copies `ocr_records` into `ocr_records`. Documents are expected in the shape the
 * `normalize-ocr-records` data migration leaves them in; the columns are the document's fields.
 */
export const OcrRecordsMigrationConfig: MigrationConfig = {
  mongoCollection: 'ocr_records',
  pgTable: 'ocr_records',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: String(doc._id),
      source_file_id: doc.sourceFile ? String(doc.sourceFile) : null,
      result_file_id: doc.resultFile ? String(doc.resultFile) : null,
      filename: doc.filename,
      language: doc.language,
      status: doc.status,
      attempt: (doc.attempt as number | undefined) ?? 0,
      requested_at: (doc.requestedAt as number | undefined) ?? null,
      last_updated: doc.lastUpdated,
      failure_reason: (doc.failureReason as string | undefined) ?? null,
    };
  },
};
