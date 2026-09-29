/**
 * Copies Mongo collections into Postgres for one tenant (idempotent per table).
 *
 * Usage:
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name> [--force]
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --sessions
 *
 * --tenant migrates the collections gated by that tenant's active Postgres feature flags
 * (postgresCore, postgresPages, postgresCsv).
 *
 * --sessions copies the shared-database `sessions` collection into `http_sessions` once,
 * for every tenant. It does not take a tenant and it does not write a tenant column.
 * Re-running leaves rows that are already there.
 *
 * By default a collection is skipped when its PostgreSQL table already contains
 * data for the tenant. Pass --force to migrate anyway (non-destructive: existing
 * rows are left untouched and conflicting rows are ignored).
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';
import {
  AnyMigrationConfig,
  MigrateCollectionToPostgres,
} from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
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
import {
  PageLocalesMigrationConfig,
  PageMigrationConfig,
} from '#api/core/infrastructure/postgresql/migrations/configs/PageMigrationConfig.js';
import { PageReleaseMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PageReleaseMigrationConfig.js';
import {
  IXExtractorsMigrationConfig,
  IXModelsMigrationConfig,
  IXSuggestionsMigrationConfig,
} from '#api/core/infrastructure/postgresql/migrations/configs/index.js';
import { CsvImportsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportsMigrationConfig.js';
import { CsvImportRowsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRowsMigrationConfig.js';
import { CsvImportRowErrorsMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRowErrorsMigrationConfig.js';
import { CsvImportThesauriValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportThesauriValuesMigrationConfig.js';
import { CsvImportRelationshipPendingValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRelationshipPendingValuesMigrationConfig.js';
import { CsvImportRelationshipValuesMigrationConfig } from '#api/csv.v2/infrastructure/postgresql/migrations/CsvImportRelationshipValuesMigrationConfig.js';
import { copyHttpSessions } from '#api/core/infrastructure/postgresql/migrations/copyHttpSessions.js';

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
  settings: SettingsMigrationConfig,
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
};

// Collections grouped by the feature flag that gates their migration. A group is
// migrated only when its flag is active on the tenant, in the order listed: a table
// comes after the tables its foreign keys reference.
const FLAG_GROUPS: Record<'postgresCore' | 'postgresPages' | 'postgresCsv', string[]> = {
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
    'ix_extractors',
    'ix_models',
    'ix_suggestions',
    'settings',
  ],
  postgresPages: ['pages', 'page_locales', 'page_releases'],
  postgresCsv: [
    'csv_imports',
    'csv_import_rows',
    'csv_import_row_errors',
    'csv_import_thesauri_values',
    'csv_import_relationships_pending_values',
    'csv_import_relationships_values',
  ],
};

function log(message: string) {
  process.stdout.write(`${message}\n`);
}

function logError(message: string) {
  process.stderr.write(`${message}\n`);
}

const argv = yargs(hideBin(process.argv))
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to migrate collections for',
  })
  .option('sessions', {
    type: 'boolean',
    describe: 'Copy HTTP sessions from the shared database into http_sessions. Not per tenant.',
    default: false,
  })
  .option('force', {
    alias: 'f',
    type: 'boolean',
    describe:
      'Migrate collections even if the PostgreSQL table already contains data (non-destructive)',
    default: false,
  })
  .check(args => {
    if (!args.sessions && !args.tenant) {
      throw new Error('Missing required argument: tenant (or pass --sessions)');
    }
    return true;
  })
  .strict()
  .parseSync();

async function migrateCollection(
  tenantName: string,
  collectionName: string,
  migrationConfig: AnyMigrationConfig
): Promise<void> {
  await tenants.run(async () => {
    const mongoDb = DB.mongodb_Db(tenants.current().dbName);
    log(`[${tenantName}] Starting migration: ${collectionName}`);
    log(`[${tenantName}] MongoDB collection: ${migrationConfig.mongoCollection}`);
    log(`[${tenantName}] PostgreSQL table: ${migrationConfig.pgTable}`);

    const result = await new MigrateCollectionToPostgres(mongoDb, tenantName).migrate(
      migrationConfig,
      { force: argv.force }
    );

    const orphans = result.orphansSkipped ? `, skipped ${result.orphansSkipped} orphans` : '';
    const summary = result.skipped
      ? `Skipped ${collectionName}: PostgreSQL table already contains data for tenant`
      : `Migrated ${result.migrated} rows for ${collectionName}${orphans}`;
    log(`[${tenantName}] ${summary}`);
  }, tenantName);
}

async function cleanup(): Promise<void> {
  await tenants.model?.closeChangeStream();
  await DB.disconnect();
  await PostgresDB.disconnect();
}

function assertKnownTenant(tenantName: string): void {
  if (tenants.tenants[tenantName]) {
    return;
  }
  logError(`Unknown tenant: ${tenantName}`);
  logError(`Available tenants: ${Object.keys(tenants.tenants).join(', ')}`);
  process.exit(1);
}

// oxlint-disable-next-line max-statements
async function run(): Promise<void> {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();

  if (argv.sessions) {
    const result = await copyHttpSessions(DB.mongodb_Db(config.SHARED_DB));
    log(
      `Copied ${result.copied} http sessions from ${config.SHARED_DB} (${result.alreadyPresent} already present).`
    );
    await cleanup();
    return;
  }

  const tenantName = argv.tenant;
  if (!tenantName) {
    throw new Error('Missing required argument: tenant');
  }
  assertKnownTenant(tenantName);

  const tenant = tenants.tenants[tenantName];
  const flags = Object.keys(FLAG_GROUPS) as (keyof typeof FLAG_GROUPS)[];

  for (const flag of flags) {
    if (!tenant.featureFlags?.[flag]) {
      log(`[${tenantName}] Skipping ${flag} group: feature flag is not active`);
    }
  }

  const collectionsToMigrate = flags
    .filter(flag => tenant.featureFlags?.[flag])
    .flatMap(flag => FLAG_GROUPS[flag]);

  if (collectionsToMigrate.length === 0) {
    log(`[${tenantName}] No collections to migrate: no active Postgres feature flags`);
    await cleanup();
    return;
  }

  for (const collectionName of collectionsToMigrate) {
    // eslint-disable-next-line no-await-in-loop
    await migrateCollection(tenantName, collectionName, COLLECTIONS[collectionName]);
  }

  log('Migration completed successfully.');
  await cleanup();
}

run().catch(async error => {
  logError(`Migration failed: ${error}`);
  await cleanup();
  process.exit(1);
});
