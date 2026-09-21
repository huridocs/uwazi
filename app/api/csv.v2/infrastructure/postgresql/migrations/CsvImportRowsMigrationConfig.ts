import { MigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { csvMigrationIdOf } from './csvMigrationId.js';

export const CsvImportRowsMigrationConfig: MigrationConfig = {
  mongoCollection: 'csv_import_rows',
  pgTable: 'csv_import_rows',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: csvMigrationIdOf(doc._id),
      import_id: csvMigrationIdOf(doc.importId),
      row_index: doc.rowIndex,
      headers: doc.headers,
      values: doc.values,
    };
  },
};
