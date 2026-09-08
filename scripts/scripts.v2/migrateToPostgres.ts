/**
 * Copies Mongo collections into Postgres for one tenant (idempotent per table).
 *
 * Usage:
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name>
 *
 * Migrates the collections gated by the tenant's active Postgres feature flags
 * (postgresCore, postgresPages).
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
import { UsersMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/UsersMigrationConfig.js';
import { UserGroupsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/UserGroupsMigrationConfig.js';
import { PasswordRecoveryMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PasswordRecoveryMigrationConfig.js';
import { TranslationsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/TranslationsMigrationConfig.js';
import { EntitiesMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/EntitiesMigrationConfig.js';
import {
  PageLocalesMigrationConfig,
  PageMigrationConfig,
} from '#api/core/infrastructure/postgresql/migrations/configs/PageMigrationConfig.js';
import { PageReleaseMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/PageReleaseMigrationConfig.js';

const COLLECTIONS: Record<string, AnyMigrationConfig> = {
  thesauri: ThesaurusMigrationConfig,
  templates: TemplateMigrationConfig,
  files: FilesMigrationConfig,
  relationship_types: RelationshipTypesMigrationConfig,
  users: UsersMigrationConfig,
  usergroups: UserGroupsMigrationConfig,
  password_recoveries: PasswordRecoveryMigrationConfig,
  translations: TranslationsMigrationConfig,
  entities: EntitiesMigrationConfig,
  pages: PageMigrationConfig,
  // A page's locales are nested in the mongo document, so they are their own pass.
  page_locales: PageLocalesMigrationConfig,
  page_releases: PageReleaseMigrationConfig,
};

// Collections grouped by the feature flag that gates their migration. A group is
// migrated only when its flag is active on the tenant.
const FLAG_GROUPS: Record<'postgresCore' | 'postgresPages', string[]> = {
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
  ],
  postgresPages: ['pages', 'page_locales', 'page_releases'],
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
    demandOption: true,
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
      migrationConfig
    );

    const summary = result.skipped
      ? `Skipped ${collectionName}: PostgreSQL table already contains data for tenant`
      : `Migrated ${result.migrated} rows for ${collectionName}`;
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

async function run(): Promise<void> {
  await DB.connect(config.DBHOST, config.DBAUTH);
  await tenants.setupTenants();
  assertKnownTenant(argv.tenant);

  const tenant = tenants.tenants[argv.tenant];
  const flags = Object.keys(FLAG_GROUPS) as (keyof typeof FLAG_GROUPS)[];

  for (const flag of flags) {
    if (!tenant.featureFlags?.[flag]) {
      log(`[${argv.tenant}] Skipping ${flag} group: feature flag is not active`);
    }
  }

  const collectionsToMigrate = flags
    .filter(flag => tenant.featureFlags?.[flag])
    .flatMap(flag => FLAG_GROUPS[flag]);

  if (collectionsToMigrate.length === 0) {
    log(`[${argv.tenant}] No collections to migrate: no active Postgres feature flags`);
    await cleanup();
    return;
  }

  for (const collectionName of collectionsToMigrate) {
    // eslint-disable-next-line no-await-in-loop
    await migrateCollection(argv.tenant, collectionName, COLLECTIONS[collectionName]);
  }

  log('Migration completed successfully.');
  await cleanup();
}

run().catch(async error => {
  logError(`Migration failed: ${error}`);
  await cleanup();
  process.exit(1);
});
