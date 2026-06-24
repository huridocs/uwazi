import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';

const mockSnapshotData = {
  datavizId: 'pending',
  generatedAt: new Date().toISOString(),
  stale: false,
  meta: { totalEntities: 2, truncated: false },
  series: [{ id: 'main', label: 'Series', points: [{ key: 'a', label: 'A', value: 2 }] }],
};

const createMockQueryExecutor = (): DatavizQueryExecutor => ({
  execute: jest.fn().mockImplementation(async (_query, context) => ({
    ...mockSnapshotData,
    datavizId: context.datavizId ?? 'pending',
  })),
});

const createSut = (scheduler: DatavizScheduler, queryExecutor = createMockQueryExecutor()) =>
  testingEnvironment.runWithContext(() => {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return {
      sut: new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizDataSourceFactory.default(),
          snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
          queryExecutor,
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      ),
      queryExecutor,
      snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
    };
  });

const baseInput = {
  name: 'Cars by color',
  query: {
    sources: [{ templateId: '507f1f77bcf86cd799439011' }],
    dimensions: [{ property: 'color', propertyType: 'select' as const }],
    measures: [{ aggregation: 'count' as const }],
  },
  chart: { type: 'pie' as const },
  appearance: { colorMode: 'from_data' as const },
  refresh: { refreshMode: 'snapshot_manual' as const },
};

describe('CreateDatavizUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should persist a dataviz definition and snapshot', async () => {
    const schedule = jest.fn();
    const { sut, snapshotsDS } = createSut({ cancelPending: jest.fn(), schedule });

    const dataviz = await sut.execute(baseInput);

    expect(dataviz.id).toBeDefined();
    expect(dataviz.name).toBe('Cars by color');
    expect(dataviz.refresh.lastRefreshedAt).toBeDefined();
    expect(schedule).not.toHaveBeenCalled();

    const snapshot = await snapshotsDS.getByDatavizId(dataviz.id);
    expect(snapshot.isOk()).toBe(true);
  });

  it('should reject query visualizations without dimensions unless using count metric', async () => {
    const schedule = jest.fn();
    const { sut } = createSut({ cancelPending: jest.fn(), schedule });

    await expect(
      sut.execute({
        name: 'Untitled visualization',
        query: {
          sources: [{ templateId: '507f1f77bcf86cd799439011' }],
          dimensions: [],
          measures: [{ aggregation: 'sum', property: 'price', propertyType: 'numeric' }],
        },
        chart: { type: 'metric' },
        appearance: { colorMode: 'from_data' },
        refresh: { refreshMode: 'live' },
      })
    ).rejects.toThrow();

    expect(schedule).not.toHaveBeenCalled();
  });

  it('should schedule future refresh for snapshot_scheduled mode without immediate job', async () => {
    const schedule = jest.fn();
    const { sut } = createSut({ cancelPending: jest.fn(), schedule });

    await sut.execute({
      ...baseInput,
      name: 'Scheduled chart',
      refresh: { refreshMode: 'snapshot_scheduled', schedule: 'daily', scheduleTime: '02:00' },
    });

    expect(schedule).toHaveBeenCalledWith(expect.anything(), expect.anything(), false);
  });
});
