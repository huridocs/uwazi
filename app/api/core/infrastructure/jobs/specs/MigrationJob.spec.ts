import path from 'path';

import { MigrationJob } from '#api/core/infrastructure/jobs/MigrationJob.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { SyncJobsDispatcher } from '#api/core/libs/queue/infrastructure/SyncJobsDispatcher.js';
import migrationsModel from '#api/migrations/migrationsModel.js';
import { migrator } from '#api/migrations/migrator.js';
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

type MigrationRegistry = {
  [name: string]: () => Promise<MigrationJob>;
};

const createMigrationDispatcher = (registry: MigrationRegistry) => new SyncJobsDispatcher(registry);

const createJobFactory = (deps: {
  migrator?: typeof migrator;
  pgMigrator?: FakePgMigrator | PgMigrator;
  logger?: ReturnType<typeof createMockLogger>;
  reindexTenant?: jest.Mock;
}) => {
  const dispatcherRegistry: MigrationRegistry = {};
  const dispatcher = createMigrationDispatcher(dispatcherRegistry);

  dispatcherRegistry.MigrationJob = async () =>
    new MigrationJob({
      migrator: deps.migrator || migrator,
      pgMigrator: (deps.pgMigrator as any) || new FakePgMigrator(),
      logger: deps.logger || createMockLogger(),
      dispatcher,
      reindexTenant: deps.reindexTenant || jest.fn(),
    });

  return { dispatcher, registry: dispatcherRegistry };
};

describe('MigrationJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await testingDB.clear();
    migrator.migrationsDir = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'migrations/specs/testMigrations'
    );
    migrator.loader = async (p: string) =>
      Promise.resolve(
        (function resolveModule(r: NodeRequire) {
          const m = r(p);
          return m.default ?? m;
        })(require)
      );
  });

  it('should apply the next data migration on the tenant and dispatch itself', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    const migrations = await migrationsModel.get();
    expect(migrations.map(m => m.delta).sort((a, b) => a - b)).toEqual([1, 2, 3, 10]);

    expect(dispatchSpy).toHaveBeenCalledTimes(4);
    expect(dispatchSpy).toHaveBeenLastCalledWith(MigrationJob, {
      reindex: true,
      results: { appliedDataDeltas: [1, 2, 3, 10], appliedSchemaDeltas: [] },
    });
  });

  it('should advance schema when data migration is blocked', async () => {
    await migrationsModel.save({ delta: 1 });
    await migrationsModel.save({ delta: 2 });

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 99, maxDelta: 100 });
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(await pgMigrator.getCurrentVersion()).toBe(100);

    const migrations = await migrationsModel.get();
    expect(migrations.map(m => m.delta).sort((a, b) => a - b)).toEqual([1, 2, 3, 10]);
  });

  it('should run all pending data migrations then remaining schema migrations and stop', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 0, maxDelta: 100 });
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    const migrations = await migrationsModel.get();
    expect(migrations.map(m => m.delta).sort((a, b) => a - b)).toEqual([1, 2, 3, 10]);

    expect(dispatchSpy).toHaveBeenCalledTimes(4);
    const lastCall = dispatchSpy.mock.calls[3][1] as {
      reindex: boolean;
      results: { appliedDataDeltas: number[]; appliedSchemaDeltas: number[] };
    };
    expect(lastCall).toEqual({
      reindex: true,
      results: {
        appliedDataDeltas: [1, 2, 3, 10],
        appliedSchemaDeltas: expect.arrayContaining([1]),
      },
    });
    expect(lastCall.results.appliedSchemaDeltas).toHaveLength(100);

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should reindex all tenants when the final job has reindex flag', async () => {
    await migrationsModel.save({ delta: 1 });
    await migrationsModel.save({ delta: 2 });
    await migrationsModel.save({ delta: 3 });
    await migrationsModel.save({ delta: 10 });

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({ logger, reindexTenant });

    await dispatcher.dispatch(MigrationJob, {
      reindex: true,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should not reindex when reindex flag is false', async () => {
    await migrationsModel.save({ delta: 1 });
    await migrationsModel.save({ delta: 2 });
    await migrationsModel.save({ delta: 3 });
    await migrationsModel.save({ delta: 10 });

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({ logger, reindexTenant });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).not.toHaveBeenCalled();
  });

  it('should skip already applied migrations on retry', async () => {
    await migrationsModel.save({ delta: 1 });

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });
    const dispatchSpy = jest.spyOn(dispatcher, 'dispatch');

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    const migrations = await migrationsModel.get();
    expect(migrations.map(m => m.delta).sort((a, b) => a - b)).toEqual([1, 2, 3, 10]);

    expect(dispatchSpy).toHaveBeenCalledTimes(3);
  });

  it('should propagate reindex flag through the chain', async () => {
    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const pgMigrator = new FakePgMigrator({ currentVersion: 100 });
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(reindexTenant).toHaveBeenCalledTimes(1);
  });

  it('should handle tenant that is already up to date', async () => {
    await migrationsModel.save({ delta: 1 });
    await migrationsModel.save({ delta: 2 });
    await migrationsModel.save({ delta: 3 });
    await migrationsModel.save({ delta: 10 });

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({ logger, reindexTenant });
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
    const { dispatcher } = createJobFactory({ logger, reindexTenant, pgMigrator });

    await dispatcher.dispatch(MigrationJob, {
      reindex: false,
      results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
    });

    expect(logger.info).toHaveBeenCalledWith('Starting migration job', expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith('Current schema version: 100', expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith('Migration process complete', expect.any(Object));
  });

  it('should throw when a migration fails', async () => {
    const failingMigrator = {
      migrationsDir: migrator.migrationsDir,
      loader: migrator.loader,
      migrateNext: async () => {
        throw new Error('migration failed');
      },
      migrateDelta: async () => {
        throw new Error('migration failed');
      },
    };

    const logger = createMockLogger();
    const reindexTenant = jest.fn();
    const { dispatcher } = createJobFactory({
      migrator: failingMigrator as any,
      logger,
      reindexTenant,
    });

    await expect(
      dispatcher.dispatch(MigrationJob, {
        reindex: false,
        results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
      })
    ).rejects.toThrow('migration failed');
  });
});
