import { TenantMigrationRunner } from '#api/core/infrastructure/mongodb/TenantMigrationRunner.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MigrationJobFactory } from '../MigrationJobFactory.js';

jest.mock('#api/search/entitiesIndex.js', () => ({
  __esModule: true,
  reindexAll: jest.fn(),
}));
jest.mock('#api/search/index.js', () => ({
  __esModule: true,
  search: { mockSearch: 'search' },
}));
jest.mock('#api/core/v1_layer/templates/index.js', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import { reindexAll } from '#api/search/entitiesIndex.js';
import { search } from '#api/search/index.js';
import templatesModule from '#api/core/v1_layer/templates/index.js';

const createFakeRunner = (): TenantMigrationRunner => ({
  async tenantExists() {
    return true;
  },
  async getPendingMigrations() {
    return { runnable: [], blocked: null };
  },
  async migrateDelta() {
    return { status: 'done' };
  },
});

const fakePgMigrator = {
  async getCurrentVersion() {
    return 0;
  },
  async migrate() {
    return [];
  },
};

const fakeDispatcher: JobsDispatcher = {
  async dispatch() {},
  async dispatchMany() {},
  async deleteByParams() {},
  async cancelByParams() {},
  async countByName() {
    return 0;
  },
};

describe('MigrationJobFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (templatesModule.get as jest.Mock).mockResolvedValue([{ _id: 'template1' }]);
  });

  it('should wire reindexTenant to the production reindex implementation', async () => {
    const setMaintenance = jest.fn();
    const tenantsManager = {
      tenants: { default: { name: 'default', dbName: 'default_db' } },
      current() {
        return this.tenants.default;
      },
      async run(fn: () => Promise<void>) {
        await fn();
      },
      setMaintenance,
    };

    const job = MigrationJobFactory.create({
      runner: createFakeRunner(),
      pgMigrator: fakePgMigrator as any,
      logger: createMockLogger(),
      dispatcher: fakeDispatcher,
      tenantsManager: tenantsManager as any,
    });

    await job.handleDispatch(
      async () => {},
      {
        reindexTenants: ['default'],
        results: { appliedDataDeltas: [], appliedSchemaDeltas: [] },
      },
      { retryCount: 0, maxRetries: 0, namespace: 'system' }
    );

    expect(templatesModule.get).toHaveBeenCalled();
    expect(reindexAll).toHaveBeenCalledWith([{ _id: 'template1' }], search);
    expect(setMaintenance).toHaveBeenCalledWith('default', true);
    expect(setMaintenance).toHaveBeenCalledWith('default', false);
  });
});
