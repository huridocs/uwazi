// eslint-disable-next-line no-restricted-imports
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from '#api/config.js';
import { MigrationJobFactory } from '#api/core/infrastructure/factories/MigrationJobFactory.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';
import { TenantMigrationRunnerAdapter } from '#api/core/infrastructure/mongodb/TenantMigrationRunnerAdapter.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { SyncJobsDispatcher } from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';
import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import testingDB from '#api/utils/testing_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TENANT = config.defaultTenant.name;
const TENANT_B = 'tenantB';

/**
 * Jest's module resolver intercepts dynamic `import()` and cannot resolve the
 * production loader's `import(pathToFileURL(p).href)`, so load the migration
 * modules with require, like app/api/migrations/specs/migrator.spec.js does.
 * Like the production loader, the module is cached: mutations a migration makes
 * to its own module (e.g. a dynamic reindex flag) persist across tenants, which
 * is exactly the behavior the sticky-flag test relies on.
 */
const loadMigration = async (p: string): Promise<any> => {
  const m = require(path.resolve(p));
  return m.default ?? m;
};

const REINDEX_MIGRATIONS_DIR = path.join(__dirname, 'testMigrations', 'reindex');
const NO_REINDEX_MIGRATIONS_DIR = path.join(__dirname, 'testMigrations', 'noreindex');
const BLOCKED_MIGRATIONS_DIR = path.join(__dirname, 'testMigrations', 'blocked');
const FAILING_MIGRATIONS_DIR = path.join(__dirname, 'testMigrations', 'failing');
const DYNAMIC_REINDEX_MIGRATIONS_DIR = path.join(__dirname, 'testMigrations', 'dynamic-reindex');

let pgMigrationsDir = '';
let maintenanceCalls: Array<[string, boolean]> = [];
let reindexCalls: string[] = [];
let spiesToRestore: jest.SpyInstance[] = [];

/**
 * Wires the real chain: real TenantMigrationRunnerAdapter (real migrations
 * collection, real per-tenant context), real PgMigrator, real
 * SyncJobsDispatcher. The only mocks are the reindex call and setMaintenance.
 */
const createRunChain = (migrationsDir: string, reindexFails = false) => {
  const reindexTenant = jest.fn(async () => {
    // Called inside tenantsManager.run(...), so current() resolves the real tenant
    reindexCalls.push(tenants.current().name);
    if (reindexFails) {
      throw new Error('reindex failed');
    }
  });

  const setMaintenanceSpy = jest
    .spyOn(tenants, 'setMaintenance')
    .mockImplementation(async (tenantName, maintenance) => {
      maintenanceCalls.push([tenantName, maintenance]);
    });
  spiesToRestore.push(setMaintenanceSpy);

  const runner = new TenantMigrationRunnerAdapter(migrationsDir, loadMigration);
  const pgMigrator = new PgMigrator(pgMigrationsDir, testingEnvironment.pg.pool as any);

  let dispatcher: SyncJobsDispatcher | undefined;
  const createJob = async () =>
    MigrationJobFactory.create({
      runner,
      pgMigrator,
      reindexTenant,
      logger: createMockLogger(),
      dispatcher: dispatcher as SyncJobsDispatcher,
    });
  dispatcher = new SyncJobsDispatcher({ MigrationJob: createJob });

  const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');
  spiesToRestore.push(dispatchSpy);

  return { dispatcher, dispatchSpy, reindexTenant };
};

const initialResults = () => ({ appliedDataDeltas: [], appliedSchemaDeltas: [] });

describe('MigrationJob (real chain)', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    await testingDB.connect();
    testingTenants.restoreCurrentFn();
    tenants.add({ name: DEFAULT_TENANT, dbName: testingDB.dbName });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingDB.clear();
    maintenanceCalls = [];
    reindexCalls = [];
    pgMigrationsDir = mkdtempSync(path.join(os.tmpdir(), 'uwazi-pg-migrations-'));
    // The real adapter only migrates tenants that have a settings collection.
    await testingDB.mongodb!.collection('settings').insertOne({});
  });

  afterEach(async () => {
    rmSync(pgMigrationsDir, { recursive: true, force: true });
    spiesToRestore.forEach(spy => spy.mockRestore());
    spiesToRestore = [];
    // Clean up the tracking table created by the real PgMigrator
    const { pool } = testingEnvironment.pg;
    if (pool) {
      try {
        await pool.query('DROP TABLE IF EXISTS pg_migrations');
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('reindexes only the tenants that applied a reindex:true migration and hands the list to the next run', async () => {
    const tenantBDbName = `tenant_b_${testingDB.id().toHexString()}`;
    tenants.add({ name: TENANT_B, dbName: tenantBDbName });
    await testingDB.db(tenantBDbName).collection('settings').insertOne({});
    // tenantB already applied delta 1, so run 1 only applies it on default
    await testingDB.db(tenantBDbName).collection('migrations').insertOne({ delta: 1 });

    const { dispatcher, dispatchSpy, reindexTenant } = createRunChain(REINDEX_MIGRATIONS_DIR);
    const results = initialResults();

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results });

    // calls[0] is the initial dispatch; calls[1] is the run 1 -> run 2 handoff,
    // carrying only the tenant that applied delta 1
    const redispatchedTenants = dispatchSpy.mock.calls.map(
      call => (call[1] as { reindexTenants: string[] }).reindexTenants
    );
    expect(redispatchedTenants).toEqual([[], ['default']]);

    // run 2 merged tenantB (delta 2) into the accumulated list -> both reindexed
    expect(reindexTenant).toHaveBeenCalledTimes(2);
    expect(reindexCalls).toEqual(['default', TENANT_B]);
    expect(maintenanceCalls).toEqual([
      ['default', true],
      ['default', false],
      [TENANT_B, true],
      [TENANT_B, false],
    ]);

    // real database state: both tenants applied delta 2, default also delta 1
    const defaultMigrations = await testingDB.mongodb!.collection('migrations').find().toArray();
    expect(defaultMigrations.map(m => m.delta).sort()).toEqual([1, 2]);
    const tenantBMigrations = await testingDB
      .db(tenantBDbName)
      .collection('migrations')
      .find()
      .toArray();
    expect(tenantBMigrations.map(m => m.delta).sort()).toEqual([1, 2]);

    // the migrations' up() really ran, per tenant
    const defaultProbes = await testingDB.mongodb!.collection('migrationProbe').find().toArray();
    expect(defaultProbes.map(p => p.delta).sort()).toEqual([1, 2]);
    const tenantBProbes = await testingDB
      .db(tenantBDbName)
      .collection('migrationProbe')
      .find()
      .toArray();
    expect(tenantBProbes.map(p => p.delta)).toEqual([2]);

    expect(results.appliedDataDeltas).toEqual([1, 2]);
  });

  it('does not reindex at all when no applied migration is flagged reindex:true', async () => {
    const { dispatcher, dispatchSpy, reindexTenant } = createRunChain(NO_REINDEX_MIGRATIONS_DIR);

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(reindexTenant).not.toHaveBeenCalled();
    expect(reindexCalls).toEqual([]);
    expect(maintenanceCalls).toEqual([]);

    const defaultMigrations = await testingDB.mongodb!.collection('migrations').find().toArray();
    expect(defaultMigrations.map(m => m.delta)).toEqual([1]);
  });

  it('does not reindex tenants that do not have a settings collection', async () => {
    const tenantBDbName = `tenant_b_${testingDB.id().toHexString()}`;
    tenants.add({ name: TENANT_B, dbName: tenantBDbName });
    // no settings doc for tenantB -> the real adapter treats it as not ready

    const { dispatcher, reindexTenant } = createRunChain(REINDEX_MIGRATIONS_DIR);

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
    expect(reindexCalls).toEqual(['default']);
    expect(maintenanceCalls).toEqual([
      ['default', true],
      ['default', false],
    ]);

    const tenantBMigrations = await testingDB
      .db(tenantBDbName)
      .collection('migrations')
      .find()
      .toArray();
    expect(tenantBMigrations).toEqual([]);
  });

  it('does nothing when the tenant is already up to date', async () => {
    await testingDB.mongodb!.collection('migrations').insertMany([{ delta: 1 }, { delta: 2 }]);

    const { dispatcher, dispatchSpy, reindexTenant } = createRunChain(REINDEX_MIGRATIONS_DIR);

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() });

    expect(dispatchSpy).toHaveBeenCalledTimes(1); // initial dispatch, nothing pending -> finish
    expect(reindexTenant).not.toHaveBeenCalled();
    expect(reindexCalls).toEqual([]);
    expect(maintenanceCalls).toEqual([]);
  });

  it('advances the real postgres schema when a data migration is blocked', async () => {
    writeFileSync(
      path.join(pgMigrationsDir, '001-init.sql'),
      'CREATE TABLE IF NOT EXISTS migration_pg_probe_1 (id serial);'
    );
    writeFileSync(
      path.join(pgMigrationsDir, '002-later.sql'),
      'CREATE TABLE IF NOT EXISTS migration_pg_probe_2 (id serial);'
    );

    const { dispatcher, dispatchSpy, reindexTenant } = createRunChain(BLOCKED_MIGRATIONS_DIR);

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() });

    // delta 1 requires schema 1: blocked -> real pg migration 001 applied -> unblocked ->
    // data migration applied -> finish applies the remaining pg migration 002
    expect(dispatchSpy).toHaveBeenCalledTimes(1); // no re-dispatch: everything finished in one run
    const pgMigrator = new PgMigrator(pgMigrationsDir, testingEnvironment.pg.pool as any);
    expect(await pgMigrator.getCurrentVersion()).toBe(2);

    expect(reindexTenant).toHaveBeenCalledTimes(1);
    expect(reindexCalls).toEqual(['default']);
    expect(maintenanceCalls).toEqual([
      ['default', true],
      ['default', false],
    ]);

    const defaultMigrations = await testingDB.mongodb!.collection('migrations').find().toArray();
    expect(defaultMigrations.map(m => m.delta)).toEqual([1]);
  });

  it('keeps maintenance mode when the reindex fails', async () => {
    const { dispatcher, reindexTenant } = createRunChain(REINDEX_MIGRATIONS_DIR, true);

    await expect(
      dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() })
    ).rejects.toThrow('reindex failed');

    expect(reindexTenant).toHaveBeenCalledTimes(1);
    // maintenance is kept on: a failed reindex must not leave the tenant serving a
    // half-reindexed index
    expect(maintenanceCalls).toEqual([['default', true]]);
  });

  it('propagates errors thrown by a failing migration file', async () => {
    const { dispatcher } = createRunChain(FAILING_MIGRATIONS_DIR);

    await expect(
      dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() })
    ).rejects.toThrow('boom from migration');

    expect(maintenanceCalls).toEqual([]);
  });

  it('only reindexes tenants that actually deleted something when the migration sets its flag dynamically', async () => {
    const tenantBDbName = `tenant_b_${testingDB.id().toHexString()}`;
    tenants.add({ name: TENANT_B, dbName: tenantBDbName });
    await testingDB.db(tenantBDbName).collection('settings').insertOne({});
    // default has a probe doc to delete, tenantB has none
    await testingDB.mongodb!.collection('migrationProbe').insertOne({ marker: 'to-delete' });

    const { dispatcher, reindexTenant } = createRunChain(DYNAMIC_REINDEX_MIGRATIONS_DIR);

    await dispatcher.dispatch(MigrationJob, { reindexTenants: [], results: initialResults() });

    // the migration module is cached across tenants, but the flag is recomputed per
    // tenant: only default deleted something, so only default is reindexed
    expect(reindexTenant).toHaveBeenCalledTimes(1);
    expect(reindexCalls).toEqual(['default']);
    expect(maintenanceCalls).toEqual([
      ['default', true],
      ['default', false],
    ]);
  });
});
