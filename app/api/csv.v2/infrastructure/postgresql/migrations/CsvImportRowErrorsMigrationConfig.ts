import { MigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { csvMigrationIdOf } from './csvMigrationId.js';

export const CsvImportRowErrorsMigrationConfig: MigrationConfig = {
  mongoCollection: 'csv_import_row_errors',
  pgTable: 'csv_import_row_errors',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: csvMigrationIdOf(doc._id),
      import_id: csvMigrationIdOf(doc.importId),
      row_index: doc.rowIndex,
      message: doc.message,
      code: doc.code,
      property: doc.property ?? null,
      raw_value: doc.rawValue ?? null,
      details: doc.details ?? null,
      created_at: doc.createdAt,
    };
  },
};
