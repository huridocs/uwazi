import { MigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { csvMigrationIdOf } from './csvMigrationId.js';

export const CsvImportsMigrationConfig: MigrationConfig = {
  mongoCollection: 'csv_imports',
  pgTable: 'csv_imports',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: csvMigrationIdOf(doc._id),
      template_id: csvMigrationIdOf(doc.templateId),
      status: doc.status,
      created_by: csvMigrationIdOf(doc.createdBy),
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
      files_cleanup: doc.filesCleanup ?? null,
      file: doc.file,
      storage: doc.storage ?? null,
      stats: doc.stats ?? null,
      progress: doc.progress ?? null,
      extraction: doc.extraction ?? null,
      failure: doc.failure ?? null,
      row_errors: doc.rowErrors ?? null,
    };
  },
};
