import { Connection } from 'mongoose';
import knex from 'knex';
import testingDB from '#api/utils/testing_db.js';
import { DB } from '#api/odm/index.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { MigrationService } from '#api/migrations/MigrationService.js';

const createFakeDispatcher = (calls: any[]): JobsDispatcher => ({
  dispatch: async (_dispatchable: any, params: any) => {
    calls.push(params);
  },
  dispatchMany: async () => {},
  deleteByParams: async () => {},
  cancelByParams: async () => {},
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
  let postgresConnectSpy: jest.SpyInstance;
  let postgresDisconnectSpy: jest.SpyInstance;

  beforeAll(async () => {
    connection = await testingDB.connect();
    connectSpy = jest.spyOn(DB, 'connect').mockResolvedValue(Promise.resolve(connection));
    disconnectSpy = jest.spyOn(DB, 'disconnect').mockResolvedValue(Promise.resolve());
    postgresConnectSpy = jest.spyOn(PostgresDB, 'connect').mockReturnValue(knex({ client: 'pg' }));
    postgresDisconnectSpy = jest
      .spyOn(PostgresDB, 'disconnect')
      .mockResolvedValue(Promise.resolve());
  });

  afterAll(async () => {
    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
    postgresConnectSpy.mockRestore();
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
      transactionManagerFactory: TransactionManagerFactory.default,
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
      reindex: false,
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
      connect: jest.fn(),
      disconnect: jest.fn().mockResolvedValue(undefined),
      pool: jest.fn().mockReturnValue({ query: jest.fn() }),
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
    expect(postgresDB.connect).toHaveBeenCalled();
    expect(db.disconnect).toHaveBeenCalled();
    expect(postgresDB.disconnect).toHaveBeenCalled();
  });
});
