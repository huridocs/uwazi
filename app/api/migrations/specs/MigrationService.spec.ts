/* eslint-disable max-statements */
import { Connection } from 'mongoose';
import { testingDB } from '#api/utils/testing_db.js';
import { DB } from '#api/odm/index.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MigrationService } from '#api/migrations/MigrationService.js';
import { TenantPendingMigrations } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';

const createFakeDispatcher = (calls: any[], existingJobCount: number = 0): JobsDispatcher => ({
  dispatch: async (_dispatchable: any, params: any) => {
    calls.push(params);
  },
  dispatchMany: async () => {},
  deleteByParams: async () => {},
  cancelByParams: async () => {},
  countByName: async () => existingJobCount,
});

const createFakeLogger = (): Logger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  critical: jest.fn(),
});

describe('MigrationService', () => {
  let connection: Connection;
  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;
  let postgresDisconnectSpy: jest.SpyInstance;

  beforeAll(async () => {
    connection = await testingDB.connect();
    connectSpy = jest.spyOn(DB, 'connect').mockResolvedValue(Promise.resolve(connection));
    disconnectSpy = jest.spyOn(DB, 'disconnect').mockResolvedValue(Promise.resolve());
    postgresDisconnectSpy = jest
      .spyOn(PostgresDB, 'disconnect')
      .mockResolvedValue(Promise.resolve());
  });

  afterAll(async () => {
    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
    postgresDisconnectSpy.mockRestore();
    await testingDB.disconnect();
  });

  const createService = (overrides: any = {}) => {
    const dispatchedCalls: any[] = [];
    const fakePgMigrator = {
      getCurrentVersion: jest.fn().mockResolvedValue(42),
    } as unknown as PgMigrator;

    const service = new MigrationService({
      db: DB,
      postgresDB: PostgresDB,
      tenants: {
        setupTenants: jest.fn().mockResolvedValue(undefined),
        run: jest.fn().mockImplementation(async (fn: any) => fn()),
        current: jest.fn().mockReturnValue({ name: 'default', dbName: 'default' }),
        tenants: { default: { name: 'default', dbName: 'default' } },
      },
      createDispatcher: jest.fn().mockResolvedValue(createFakeDispatcher(dispatchedCalls)),
      createLogger: jest.fn().mockReturnValue(createFakeLogger()),
      pgMigratorFactory: jest.fn().mockReturnValue(fakePgMigrator),
      transactionManagerFactory: TransactionManagerFactory.mongo,
      eventEmitterFactory: EventEmitterFactory.default,
      idGeneratorFactory: IdGeneratorFactory.default,
      ...overrides,
    });

    return { service, dispatchedCalls, fakePgMigrator };
  };

  it('should dispatch MigrationJob in sync mode and return result', async () => {
    const { service, dispatchedCalls, fakePgMigrator } = createService();

    const result = await service.run({ async: false, structuredLogs: false });

    expect(result).toEqual({
      done: true,
      appliedDataDeltas: [],
      appliedSchemaDeltas: [],
      schemaVersion: 42,
    });

    expect(dispatchedCalls).toHaveLength(1);
    expect(dispatchedCalls[0]).toEqual({
      reindexTenants: [],
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });
    expect(fakePgMigrator.getCurrentVersion).toHaveBeenCalled();
  });

  it('should dispatch MigrationJob in async mode and return dispatched flag', async () => {
    const { service, dispatchedCalls } = createService();

    const result = await service.run({ async: true, structuredLogs: false });

    expect(result).toEqual({ dispatched: true });
    expect(dispatchedCalls).toHaveLength(1);
  });

  it('should connect and disconnect from both databases', async () => {
    const db = {
      connect: jest.fn().mockResolvedValue(connection),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const postgresDB = {
      disconnect: jest.fn().mockResolvedValue(undefined),
      pool: jest.fn().mockReturnValue({ query: jest.fn() }),
      adminPool: jest.fn().mockReturnValue({ query: jest.fn() }),
    };
    const fakePgMigrator = {
      getCurrentVersion: jest.fn().mockResolvedValue(0),
    } as unknown as PgMigrator;
    const { service } = createService({
      db,
      postgresDB,
      pgMigratorFactory: () => fakePgMigrator,
    });

    await service.run({ async: false, structuredLogs: false });

    expect(db.connect).toHaveBeenCalled();
    expect(db.disconnect).toHaveBeenCalled();
    expect(postgresDB.disconnect).toHaveBeenCalled();
  });

  it('should skip dispatch when a MigrationJob already exists in async mode', async () => {
    const dispatchedCalls: any[] = [];
    const db = {
      connect: jest.fn().mockResolvedValue(connection),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };
    const postgresDB = {
      disconnect: jest.fn().mockResolvedValue(undefined),
      pool: jest.fn().mockReturnValue({ query: jest.fn() }),
      adminPool: jest.fn().mockReturnValue({ query: jest.fn() }),
    };
    const { service } = createService({
      db,
      postgresDB,
      createDispatcher: jest.fn().mockResolvedValue(createFakeDispatcher(dispatchedCalls, 1)),
    });

    const result = await service.run({ async: true, structuredLogs: false });

    expect(result).toEqual({
      skipped: true,
      reason: 'MigrationJob already queued',
    });
    expect(dispatchedCalls).toHaveLength(0);
    expect(db.disconnect).toHaveBeenCalled();
    expect(postgresDB.disconnect).toHaveBeenCalled();
  });

  it('should not check for existing jobs in sync mode', async () => {
    const dispatchedCalls: any[] = [];
    const { service, fakePgMigrator } = createService({
      createDispatcher: jest.fn().mockResolvedValue(createFakeDispatcher(dispatchedCalls, 1)),
    });

    const result = await service.run({ async: false, structuredLogs: false });

    expect(result).toEqual({
      done: true,
      appliedDataDeltas: [],
      appliedSchemaDeltas: [],
      schemaVersion: 42,
    });
    expect(dispatchedCalls).toHaveLength(1);
    expect(fakePgMigrator.getCurrentVersion).toHaveBeenCalled();
  });

  describe('status', () => {
    const tenantsManager = {
      setupTenants: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockImplementation(async (fn: any) => fn()),
      current: jest.fn(),
      tenants: {
        default: { name: 'default', dbName: 'default' },
        tenantB: { name: 'tenantB', dbName: 'tenant_b' },
        upToDate: { name: 'upToDate', dbName: 'up_to_date' },
      },
    };

    const pendingByDbName: Record<string, TenantPendingMigrations> = {
      default: { runnable: [{ delta: 214 }, { delta: 215 }], blocked: null },
      tenant_b: { runnable: [], blocked: { delta: 215, requiresSchema: 40 } },
      up_to_date: { runnable: [], blocked: null },
    };

    const createStatusService = () => {
      const dispatchedCalls: any[] = [];
      const pgMigrator = {
        status: jest.fn().mockResolvedValue({
          applied: [{ delta: 34, name: 'create-activitylogs-table', kind: 'sql', applied: true }],
          pending: [
            { delta: 35, name: 'backfill-titles', kind: 'data', applied: false },
            { delta: 36, name: 'add-index', kind: 'sql', applied: false },
          ],
        }),
        migrate: jest.fn(),
      };
      const tenantMigrationRunner = {
        getPendingMigrations: jest.fn(
          async (tenant: { dbName: string }) => pendingByDbName[tenant.dbName]
        ),
      };
      const db = {
        connect: jest.fn().mockResolvedValue(connection),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };
      const postgresDB = {
        disconnect: jest.fn().mockResolvedValue(undefined),
        adminPool: jest.fn().mockReturnValue({ query: jest.fn() }),
      };
      const { service } = createService({
        db,
        postgresDB,
        tenants: tenantsManager,
        pgMigratorFactory: () => pgMigrator,
        tenantMigrationRunner,
        createDispatcher: jest.fn().mockResolvedValue(createFakeDispatcher(dispatchedCalls)),
      });
      return { service, pgMigrator, dispatchedCalls, db, postgresDB };
    };

    it('should report pending postgres migrations and pending mongo migrations per tenant', async () => {
      const { service } = createStatusService();

      expect(await service.status()).toEqual({
        postgres: {
          applied: [34],
          pending: [
            { delta: 35, name: 'backfill-titles', kind: 'data' },
            { delta: 36, name: 'add-index', kind: 'sql' },
          ],
        },
        mongo: { pendingByTenant: { default: [214, 215], tenantB: [215] } },
      });
    });

    it('should apply nothing and close both connections', async () => {
      const { service, pgMigrator, dispatchedCalls, db, postgresDB } = createStatusService();

      await service.status();

      expect(pgMigrator.migrate).not.toHaveBeenCalled();
      expect(dispatchedCalls).toHaveLength(0);
      expect(db.disconnect).toHaveBeenCalled();
      expect(postgresDB.disconnect).toHaveBeenCalled();
    });
  });
});
