import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import type { DatavizQueryExecutor } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';
import { UpdateDatavizUseCase } from '../useCases/UpdateDataviz.js';

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

const baseInput = {
  name: 'Cars by color',
  query: {
    sources: [{ templateId: '507f1f77bcf86cd799439011' }],
    dimensions: [{ property: 'color', propertyType: 'select' as const }],
    measures: [{ aggregation: 'count' as const }],
  },
  chart: { type: 'pie' as const },
  appearance: { colorMode: 'from_data' as const },
  refresh: { refreshMode: 'snapshot_scheduled' as const, schedule: 'daily' as const },
};

const createSchedulerMock = (): DatavizScheduler => ({
  cancelPending: jest.fn(),
  schedule: jest.fn(),
});

describe('UpdateDatavizUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should cancel and reschedule jobs when query changes', async () => {
    const createScheduler = createSchedulerMock();
    const queryExecutor = createMockQueryExecutor();

    const created = await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const createUseCase = new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          queryExecutor,
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler: createScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      return createUseCase.execute(baseInput);
    });

    const updateScheduler = createSchedulerMock();
    await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const updateUseCase = new UpdateDatavizUseCase(
        {
          transactionManager,
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          queryExecutor,
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler: updateScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );

      await updateUseCase.execute({
        ...created.toDefinition(),
        query: {
          ...baseInput.query,
          dimensions: [{ property: 'brand', propertyType: 'select' }],
        },
      });
    });

    expect(updateScheduler.cancelPending).toHaveBeenCalledWith(created.id);
    expect(updateScheduler.schedule).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      false
    );
    expect(queryExecutor.execute).toHaveBeenCalledTimes(2);
  });
});
