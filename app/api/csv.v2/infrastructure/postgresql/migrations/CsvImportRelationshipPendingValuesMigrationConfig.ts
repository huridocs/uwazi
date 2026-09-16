import { MigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { csvMigrationIdOf } from './csvMigrationId.js';

export const CsvImportRelationshipPendingValuesMigrationConfig: MigrationConfig = {
  mongoCollection: 'csv_import_relationships_pending_values',
  pgTable: 'csv_import_relationships_pending_values',
  mapDocument(doc: Record<string, unknown>) {
    return {
      _id: csvMigrationIdOf(doc._id),
      import_id: csvMigrationIdOf(doc.importId),
      template_id: csvMigrationIdOf(doc.templateId),
      titles: doc.titles,
      created_at: doc.createdAt,
    };
  },
};
