/**
 * Copies Mongo collections into Postgres for one tenant (idempotent per table).
 *
 * Usage:
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenant <name> [--force]
 *   node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --sessions
 *   TENANTS_BACKEND=mongo node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --tenants
 *
 * --tenant migrates the collections gated by the tenant's active Postgres feature flag
 * (postgresCore). The tenant must already be in maintenance, or the run exits 1 without copying.
 * Backends only see maintenance on their next registry poll, and requests already running keep
 * writing, so before copying the run watches the tenant's Mongo database and waits until it has
 * seen no write for --settle-seconds (default: twice TENANTS_POLL_INTERVAL_SECONDS plus 10). If
 * that does not happen within --settle-timeout seconds (default 300) the run fails. Mongo must be a
 * replica set: without a change stream the run cannot prove the tenant is quiet and fails. Any
 * write to the tenant's Mongo database during the copy also fails the run, with exit code 1.
 *
 * --sessions copies the shared-database `sessions` collection into `http_sessions` once,
 * for every tenant. It does not take a tenant and it does not write a tenant column.
 * Re-running leaves rows that are already there.
 *
 * --tenants copies the shared-database `tenants` registry into the `tenants` table and the
 * `archives` registry into `archived_tenants`, once, together. It does not take a tenant. Run it
 * with TENANTS_BACKEND=mongo: the registries are read from Mongo. Keys uwazi does not declare are
 * kept in the `tenants` `extras` column; the archived snapshot keeps only its declared fields.
 * Re-running leaves rows already there.
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
import { AnyMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { runMigrationConfig } from '#api/core/infrastructure/postgresql/migrations/runMigrationConfig.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { copyHttpSessions } from '#api/core/infrastructure/postgresql/migrations/copyHttpSessions.js';
import { copyTenants } from '#api/core/infrastructure/postgresql/migrations/copyTenants.js';
import { copyArchivedTenants } from '#api/core/infrastructure/postgresql/migrations/copyArchivedTenants.js';
import { TenantWriteFence } from '#api/core/infrastructure/postgresql/migrations/TenantWriteFence.js';
import { COLLECTIONS, FLAG_GROUPS } from './migrateToPostgresCollections.js';

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
  .option('tenants', {
    type: 'boolean',
    describe: 'Copy the tenant registry from the shared database into tenants. Not per tenant.',
    default: false,
  })
  .option('force', {
    alias: 'f',
    type: 'boolean',
    describe:
      'Migrate collections even if the PostgreSQL table already contains data (non-destructive)',
    default: false,
  })
  .option('settle-seconds', {
    type: 'number',
    describe:
      'With --tenant: seconds without a Mongo write before copying starts. Defaults to twice TENANTS_POLL_INTERVAL_SECONDS plus 10',
  })
  .option('settle-timeout', {
    type: 'number',
    describe: 'With --tenant: seconds to wait for the tenant to become quiet before failing',
    default: 300,
  })
  .check(args => {
    if (!args.sessions && !args.tenants && !args.tenant) {
      throw new Error('Missing required argument: tenant (or pass --sessions or --tenants)');
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

    const result = await runMigrationConfig({
      mongoDb,
      tenantId: tenantName,
      migration: migrationConfig,
      options: { force: argv.force },
    });

    const orphans = result.orphansSkipped ? `, skipped ${result.orphansSkipped} orphans` : '';
    const summary = result.skipped
      ? `Skipped ${collectionName}: PostgreSQL table already contains data for tenant`
      : `Migrated ${result.migrated} rows for ${collectionName}${orphans}`;
    log(`[${tenantName}] ${summary}`);
  }, tenantName);
}

let fence: TenantWriteFence | undefined;

async function cleanup(): Promise<void> {
  await fence?.stop();
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

function assertInMaintenance(tenantName: string): void {
  if (tenants.tenants[tenantName].maintenance) {
    return;
  }
  logError(`[${tenantName}] Tenant is not in maintenance: set maintenance before migrating`);
  process.exit(1);
}

function settleSeconds(): number {
  return argv['settle-seconds'] ?? config.tenantsPollIntervalSeconds * 2 + 10;
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

  if (argv.tenants) {
    const sharedDb = DB.mongodb_Db(config.SHARED_DB);
    const tenantsResult = await copyTenants(sharedDb);
    log(
      `Copied ${tenantsResult.copied} tenants from ${config.SHARED_DB} (${tenantsResult.alreadyPresent} already present).`
    );
    const archivedResult = await copyArchivedTenants(sharedDb);
    log(
      `Copied ${archivedResult.copied} archived tenants from ${config.SHARED_DB} (${archivedResult.alreadyPresent} already present).`
    );
    await cleanup();
    return;
  }

  const tenantName = argv.tenant;
  if (!tenantName) {
    throw new Error('Missing required argument: tenant');
  }
  assertKnownTenant(tenantName);
  assertInMaintenance(tenantName);

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

  fence = new TenantWriteFence(DB.mongodb_Db(tenant.dbName));
  await fence.start();
  log(
    `[${tenantName}] Waiting for ${settleSeconds()}s without Mongo writes (timeout ${argv['settle-timeout']}s)`
  );
  await fence.waitUntilQuiet({
    quietMs: settleSeconds() * 1000,
    timeoutMs: argv['settle-timeout'] * 1000,
  });

  for (const collectionName of collectionsToMigrate) {
    // eslint-disable-next-line no-await-in-loop
    await migrateCollection(tenantName, collectionName, COLLECTIONS[collectionName]);
  }

  fence.assertNoWrites();
  log('Migration completed successfully.');
  await cleanup();
}

run().catch(async error => {
  logError(`Migration failed: ${error}`);
  await cleanup();
  process.exit(1);
});
