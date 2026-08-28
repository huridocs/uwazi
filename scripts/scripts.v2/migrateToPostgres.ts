/**
 * Copies Mongo collections into Postgres for one tenant (idempotent per table).
 *
 * Usage:
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name> --collection relationship_types
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name> --all
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { DB } from '#api/odm/index.js';
import { tenants } from '#api/tenants/index.js';
import { config } from '#api/config.js';
import {
  MigrateCollectionToPostgres,
  MigrationConfig,
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
import { SettingsMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/configs/SettingsMigrationConfig.js';

const COLLECTIONS: Record<string, MigrationConfig> = {
  thesauri: ThesaurusMigrationConfig,
  templates: TemplateMigrationConfig,
  files: FilesMigrationConfig,
  relationship_types: RelationshipTypesMigrationConfig,
  users: UsersMigrationConfig,
  usergroups: UserGroupsMigrationConfig,
  password_recoveries: PasswordRecoveryMigrationConfig,
  translations: TranslationsMigrationConfig,
  entities: EntitiesMigrationConfig,
  settings: SettingsMigrationConfig,
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
  .option('collection', {
    alias: 'c',
    type: 'string',
    describe: `Collection to migrate (${Object.keys(COLLECTIONS).join('|')})`,
  })
  .option('all', {
    alias: 'a',
    type: 'boolean',
    describe: 'Migrate all supported collections',
    default: false,
  })
  .check(args => {
    if (!args.all && !args.collection) {
      throw new Error('Please specify --collection or --all');
    }
    if (args.collection && !COLLECTIONS[args.collection]) {
      throw new Error(
        `Unknown collection: ${args.collection}. Supported: ${Object.keys(COLLECTIONS).join(', ')}`
      );
    }
    return true;
  })
  .strict()
  .parseSync();

async function migrateCollection(
  tenantName: string,
  collectionName: string,
  migrationConfig: MigrationConfig
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

  const collectionsToMigrate = argv.all ? Object.keys(COLLECTIONS) : [argv.collection!];
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
