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

const COLLECTIONS: Record<string, MigrationConfig> = {
  thesauri: ThesaurusMigrationConfig,
  templates: TemplateMigrationConfig,
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
    describe: 'Collection to migrate (thesauri|templates)',
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
): Promise<number> {
  let migrated = 0;
  await tenants.run(async () => {
    const tenantConfig = tenants.current();
    const mongoDb = DB.mongodb_Db(tenantConfig.dbName);

    log(`[${tenantName}] Starting migration: ${collectionName}`);
    log(`[${tenantName}] MongoDB collection: ${migrationConfig.mongoCollection}`);
    log(`[${tenantName}] PostgreSQL table: ${migrationConfig.pgTable}`);

    const migrator = new MigrateCollectionToPostgres(mongoDb, tenantName);
    migrated = await migrator.migrate(migrationConfig);

    log(`[${tenantName}] Migrated ${migrated} rows for ${collectionName}`);
  }, tenantName);
  return migrated;
}

(async function run() {
  try {
    await DB.connect(config.DBHOST, config.DBAUTH);
    await tenants.setupTenants();

    if (!tenants.tenants[argv.tenant]) {
      logError(`Unknown tenant: ${argv.tenant}`);
      logError(`Available tenants: ${Object.keys(tenants.tenants).join(', ')}`);
      process.exit(1);
    }

    const collectionsToMigrate = argv.all ? Object.keys(COLLECTIONS) : [argv.collection!];

    for (const collectionName of collectionsToMigrate) {
      // eslint-disable-next-line no-await-in-loop
      await migrateCollection(argv.tenant, collectionName, COLLECTIONS[collectionName]);
    }

    log('Migration completed successfully.');
  } catch (error) {
    logError(`Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await tenants.model?.closeChangeStream();
    await DB.disconnect();
    await PostgresDB.disconnect();
  }
})();
