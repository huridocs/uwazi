import { AnyMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { TemplateMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/TemplateMigrationConfig.js';
import { ThesaurusMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/ThesaurusMigrationConfig.js';
import { FilesMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/FilesMigrationConfig.js';
import { RelationshipTypesMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/RelationshipTypesMigrationConfig.js';
import { ConnectionsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/ConnectionsMigrationConfig.js';
import { UsersMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/UsersMigrationConfig.js';
import { UserGroupsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/UserGroupsMigrationConfig.js';
import { PasswordRecoveryMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PasswordRecoveryMigrationConfig.js';
import { TranslationsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/TranslationsMigrationConfig.js';
import { EntitiesMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/EntitiesMigrationConfig.js';
import { SettingsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/SettingsMigrationConfig.js';
import { UpdateLogsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/UpdateLogsMigrationConfig.js';
import { SyncsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/SyncsMigrationConfig.js';
import { PreserveSyncMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PreserveSyncMigrationConfig.js';
import { ActivityLogsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/ActivityLogsMigrationConfig.js';
import {
  PageLocalesMigrationConfig,
  PageMigrationConfig,
} from '#api/core/infrastructure/postgresql/migrations/configs/PageMigrationConfig.js';
import { PageReleaseMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PageReleaseMigrationConfig.js';
import {
  IXExtractorsMigrationConfig,
  IXModelsMigrationConfig,
  IXSuggestionsMigrationConfig,
  SegmentationsMigrationConfig,
  OcrRecordsMigrationConfig,
} from '#api/core/infrastructure/postgresql/migrations/configs/index.js';
import { CsvImportsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportsMigrationConfig.js';
import { CsvImportRowsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRowsMigrationConfig.js';
import { CsvImportRowErrorsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRowErrorsMigrationConfig.js';
import { CsvImportThesauriValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportThesauriValuesMigrationConfig.js';
import { CsvImportRelationshipPendingValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRelationshipPendingValuesMigrationConfig.js';
import { CsvImportRelationshipValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRelationshipValuesMigrationConfig.js';
import { PXExtractorsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PXExtractorsMigrationConfig.js';
import { PXEntitiesStatusMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PXEntitiesStatusMigrationConfig.js';
import { DatavizMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/DatavizMigrationConfig.js';
import { DatavizSnapshotsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/DatavizSnapshotsMigrationConfig.js';

const COLLECTIONS: Record<string, AnyMigrationConfig> = {
  thesauri: ThesaurusMigrationConfig,
  templates: TemplateMigrationConfig,
  files: FilesMigrationConfig,
  relationship_types: RelationshipTypesMigrationConfig,
  connections: ConnectionsMigrationConfig,
  users: UsersMigrationConfig,
  usergroups: UserGroupsMigrationConfig,
  password_recoveries: PasswordRecoveryMigrationConfig,
  translations: TranslationsMigrationConfig,
  entities: EntitiesMigrationConfig,
  ix_extractors: IXExtractorsMigrationConfig,
  ix_models: IXModelsMigrationConfig,
  ix_suggestions: IXSuggestionsMigrationConfig,
  segmentations: SegmentationsMigrationConfig,
  ocr_records: OcrRecordsMigrationConfig,
  settings: SettingsMigrationConfig,
  updatelogs: UpdateLogsMigrationConfig,
  syncs: SyncsMigrationConfig,
  preserve_sync: PreserveSyncMigrationConfig,
  activitylogs: ActivityLogsMigrationConfig,
  pages: PageMigrationConfig,
  // A page's locales are nested in the mongo document, so they are their own pass.
  page_locales: PageLocalesMigrationConfig,
  page_releases: PageReleaseMigrationConfig,
  csv_imports: CsvImportsMigrationConfig,
  csv_import_rows: CsvImportRowsMigrationConfig,
  csv_import_row_errors: CsvImportRowErrorsMigrationConfig,
  csv_import_thesauri_values: CsvImportThesauriValuesMigrationConfig,
  csv_import_relationships_pending_values: CsvImportRelationshipPendingValuesMigrationConfig,
  csv_import_relationships_values: CsvImportRelationshipValuesMigrationConfig,
  px_extractors: PXExtractorsMigrationConfig,
  px_entities_status: PXEntitiesStatusMigrationConfig,
  dataviz: DatavizMigrationConfig,
  dataviz_snapshots: DatavizSnapshotsMigrationConfig,
};

// Collections migrated when the postgresCore feature flag is active on the tenant, in the
// order listed: a table comes after the tables its foreign keys reference.
const FLAG_GROUPS: Record<'postgresCore', string[]> = {
  postgresCore: [
    'thesauri',
    'templates',
    'files',
    'relationship_types',
    'users',
    'usergroups',
    'password_recoveries',
    'translations',
    'entities',
    'connections',
    'px_extractors',
    'px_entities_status',
    'ix_extractors',
    'ix_models',
    'ix_suggestions',
    'segmentations',
    'ocr_records',
    'settings',
    'dataviz',
    'dataviz_snapshots',
    'updatelogs',
    'syncs',
    'preserve_sync',
    'activitylogs',
    'pages',
    'page_locales',
    'page_releases',
    'csv_imports',
    'csv_import_rows',
    'csv_import_row_errors',
    'csv_import_thesauri_values',
    'csv_import_relationships_pending_values',
    'csv_import_relationships_values',
  ],
};

export { COLLECTIONS, FLAG_GROUPS };
