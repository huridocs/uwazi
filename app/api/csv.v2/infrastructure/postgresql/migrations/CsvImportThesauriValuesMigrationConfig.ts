import { MigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { csvMigrationIdOf } from './csvMigrationId.js';

export const CsvImportThesauriValuesMigrationConfig: MigrationConfig = {
  mongoCollection: 'csv_import_thesauri_values',
  pgTable: 'csv_import_thesauri_values',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: csvMigrationIdOf(doc._id),
      import_id: csvMigrationIdOf(doc.importId),
      thesaurus_id: csvMigrationIdOf(doc.thesaurusId),
      entries: doc.entries,
      created_at: doc.createdAt,
      applied_at: doc.appliedAt ?? null,
      applied_values: doc.appliedValues ?? null,
      stats: doc.stats ?? null,
    };
  },
};
