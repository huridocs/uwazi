import { TenantMigrationRunner } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';
import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import testingDB from '#api/utils/testing_db.js';
import { PgMigrator } from '../../postgresql/PgMigrator.js';

class FakePgMigrator {
  private currentVersion: number;

  private appliedDeltas: number[];

  private maxDelta: number;

  constructor({
    currentVersion = 0,
    appliedDeltas = [],
    maxDelta = 1,
  }: { currentVersion?: number; appliedDeltas?: number[]; maxDelta?: number } = {}) {
    this.currentVersion = currentVersion;
    this.appliedDeltas = appliedDeltas;
    this.maxDelta = maxDelta;
  }

  async getCurrentVersion(): Promise<number> {
    return this.currentVersion;
  }

  async migrate(until?: number): Promise<number[]> {
    const target = Math.min(until ?? this.maxDelta, this.maxDelta);
    const deltas: number[] = [];
    for (let delta = this.currentVersion + 1; delta <= target; delta += 1) {
      this.appliedDeltas.push(delta);
      deltas.push(delta);
      this.currentVersion = delta;
    }
    return deltas;
  }
}

type MigrationCatalogueEntry = {
  delta: number;
  requiresSchema?: number;
  reindex?: boolean;
};

const createFakeRunner = (options: {
  migrations: MigrationCatalogueEntry[];
  failDelta?: number;
  tenantExists?: boolean;
}): TenantMigrationRunner => {
  const dbForTenant = (tenant: { dbName: string }) => testingDB.db(tenant.dbName);

  const appliedDeltas = async (tenant: { dbName: string }) => {
    const docs = await dbForTenant(tenant).collection('migrations').find().toArray();
    return new Set(docs.map(doc => doc.delta));
  };

  return {
    async tenantExists(_tenant: { dbName: string }) {
      return options.tenantExists !== false;
    },

    async getPendingMigrations(tenant: { dbName: string }, schemaVersion: number) {
      if (options.tenantExists === false) {
        return { runnable: [], blocked: null };
      }

      const applied = await appliedDeltas(tenant);
      const pending = options.migrations.filter(migration => !applied.has(migration.delta));
      const runnable: MigrationCatalogueEntry[] = [];
      let blocked: { delta: number; requiresSchema: number } | null = null;

      for (const migration of pending) {
        if (migration.requiresSchema && migration.requiresSchema > schemaVersion) {
          blocked = { delta: migration.delta, requiresSchema: migration.requiresSchema };
          break;
        }
        runnable.push({ delta: migration.delta, requiresSchema: migration.requiresSchema });
      }

      return { runnable, blocked };
    },

    async migrateDelta(
      tenant: { dbName: string },
      delta: number,
      schemaVersion: number
    ): Promise<
      import('#api/core/infrastructure/mongodb/TenantMigrationRunner.js').TenantMigrationResult
    > {
      const migration = options.migrations.find(m => m.delta === delta);
      if (!migration) {
        return { status: 'done' };
      }
      if (migration.requiresSchema && migration.requiresSchema > schemaVersion) {
        return {
          status: 'blocked',
          blocked: { delta, requiresSchema: migration.requiresSchema },
        };
      }
      if (options.failDelta === delta) {
        throw new Error('migration failed');
      }
      await dbForTenant(tenant).collection('migrations').insertOne({ delta });
      return {
        status: 'applied',
        migration: { delta, reindex: migration.reindex ?? false },
      };
    },
  };
};

type MigrationRegistry = {
  [name: string]: () => Promise<MigrationJob>;
};

const createTestDispatcher = (
  registry: MigrationRegistry,
  heartbeat: jest.Mock
): JobsDispatcher => ({
  async dispatch(dispatchable, params) {
    const factory = registry[dispatchable.name];
    if (!factory) {
      throw new Error(`Unregistered job ${dispatchable.name}`);
    }
    const job = await factory();
    await job.handleDispatch(heartbeat, params, {
      retryCount: 0,
      maxRetries: 0,
      namespace: 'system',
    });
  },
  async dispatchMany() {},
  async deleteByParams() {},
  async cancelByParams() {},
  async countByName() {
    return 0;
  },
});

const createJobFactory = (deps: {
  runner?: TenantMigrationRunner;
  pgMigrator?: FakePgMigrator | PgMigrator;
  logger?: ReturnType<typeof createMockLogger>;
  reindexTenant?: jest.Mock;
  heartbeat?: jest.Mock;
}) => {
  const dispatcherRegistry: MigrationRegistry = {};
  const heartbeat = deps.heartbeat || jest.fn();
  const dispatcher = createTestDispatcher(dispatcherRegistry, heartbeat);

  dispatcherRegistry.MigrationJob = async () =>
    new MigrationJob({
      runner: deps.runner || createFakeRunner({ migrations: [] }),
      pgMigrator: (deps.pgMigrator as any) || new FakePgMigrator(),
      logger: deps.logger || createMockLogger(),
      dispatcher,
      reindexTenant: deps.reindexTenant || jest.fn(),
    });

  return { dispatcher, registry: dispatcherRegistry, heartbeat };
};

const defaultCatalogue: MigrationCatalogueEntry[] = [
  { delta: 1 },
  { delta: 2, reindex: true },
  { delta: 3, requiresSchema: 100 },
  { delta: 10 },
];

const saveMigration = async (delta: number) => {
  await testingDB.db(testingDB.dbName).collection('migrations').insertOne({ delta });
};

const appliedDeltas = async () =>
  (await testingDB.db(testingDB.dbName).collection('migrations').find().toArray())
    .map(m => m.delta)
    .sort((a, b) => a - b);

describe('MigrationJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingDB.clear();
  });

  it('should apply the next data migration on the tenant and dispatch itself', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(await appliedDeltas()).toEqual([1, 2, 3, 10]);

    expect(dispatchSpy).toHaveBeenCalledTimes(4);
    const lastCall = dispatchSpy.mock.calls[3][1] as {
      reindex: boolean;
      results: { appliedDataDeltas: number[]; appliedSchemaDeltas: number[] };
    };
    expect(lastCall.reindex).toBe(true);
  });

  it('should advance schema when data migration is blocked', async () => {
    await saveMigration(1);
    await saveMigration(2);

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 99, maxDelta: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(await pgMigrator.getCurrentVersion()).toBe(100);
    expect(await appliedDeltas()).toEqual([1, 2, 3, 10]);
  });

  it('should run all pending data migrations then remaining schema migrations and stop', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 0, maxDelta: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(await appliedDeltas()).toEqual([1, 2, 3, 10]);

    expect(dispatchSpy).toHaveBeenCalledTimes(4);
    const lastCall = dispatchSpy.mock.calls[3][1] as {
      reindex: boolean;
      results: { appliedDataDeltas: number[]; appliedSchemaDeltas: number[] };
    };
    expect(lastCall.reindex).toBe(true);
    expect(lastCall.results.appliedSchemaDeltas).toHaveLength(100);

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should reindex all tenants when the final job has reindex flag', async () => {
    await saveMigration(1);
    await saveMigration(2);
    await saveMigration(3);
    await saveMigration(10);

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: true,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should not reindex when reindex flag is false', async () => {
    await saveMigration(1);
    await saveMigration(2);
    await saveMigration(3);
    await saveMigration(10);

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).not.toHaveBeenCalled();
  });

  it('should skip already applied migrations on retry', async () => {
    await saveMigration(1);

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(await appliedDeltas()).toEqual([1, 2, 3, 10]);
    expect(dispatchSpy).toHaveBeenCalledTimes(3);
  });

  it('should propagate reindex flag through the chain', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should handle tenant that is already up to date', async () => {
    await saveMigration(1);
    await saveMigration(2);
    await saveMigration(3);
    await saveMigration(10);

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    expect(reindexTenant).not.toHaveBeenCalled();
  });

  it('should log migration lifecycle events', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    const infoMessages = (logger.info as jest.Mock).mock.calls.map(
      ([message]: [string]) => message
    );
    expect(infoMessages).toEqual(expect.arrayContaining(['Starting migration job']));
    expect(infoMessages).toEqual(expect.arrayContaining(['Current schema version: 100']));
    expect(infoMessages).toEqual(
      expect.arrayContaining([expect.stringContaining('Migration run complete')])
    );
    expect(infoMessages).toEqual(
      expect.arrayContaining([expect.stringContaining('Data migrations applied:')])
    );
  });

  it('should not log per-tenant migration details', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    const infoMessages = (logger.info as jest.Mock).mock.calls.map(
      ([message]: [string]) => message
    );
    expect(infoMessages).not.toEqual(
      expect.arrayContaining([expect.stringContaining('Applying migration')])
    );
    expect(infoMessages).not.toEqual(
      expect.arrayContaining([expect.stringContaining('successfully applied on tenant')])
    );
    expect(infoMessages).not.toEqual(
      expect.arrayContaining([expect.stringContaining('already applied on tenant')])
    );
    expect(infoMessages).toEqual(
      expect.arrayContaining([expect.stringContaining('Applied data migration')])
    );
  });

  it('should throw when a migration fails', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({
      logger,
      reindexTenant,
      runner: createFakeRunner({ migrations: defaultCatalogue, failDelta: 1 }),
    });

    await expect(
      dispatcher.dispatch(MigrationJob, {
        reindex: false,
        results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
      })
    ).rejects.toThrow('migration failed');
  });

  it('should heartbeat after each tenant migration', async () => {
    const heartbeat = jest.fn();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      heartbeat,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({
        migrations: [{ delta: 1 }, { delta: 2 }, { delta: 3 }, { delta: 10 }],
      }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(heartbeat).toHaveBeenCalledTimes(4);
  });

  it('should heartbeat after each tenant reindex', async () => {
    const heartbeat = jest.fn();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      heartbeat,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
    expect(heartbeat).toHaveBeenCalledTimes(5);
  });

  it('should skip reindex for tenants that do not exist', async () => {
    const heartbeat = jest.fn();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({
      heartbeat,
      reindexTenant,
      pgMigrator,
      runner: createFakeRunner({ migrations: defaultCatalogue, tenantExists: false }),
    });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).not.toHaveBeenCalled();
  });
});
