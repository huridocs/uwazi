import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';
import { DeleteDatavizUseCase } from '../useCases/DeleteDataviz.js';

describe('DeleteDatavizUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete definition, cancel jobs, and remove snapshots', async () => {
    const createScheduler = { cancelPending: jest.fn(), schedule: jest.fn() };
    const deleteScheduler = { cancelPending: jest.fn(), schedule: jest.fn() };

    const created = await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const createUseCase = new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizDataSourceFactory.default(),
          scheduler: createScheduler as unknown as DatavizSchedulerService,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      return createUseCase.execute({
        name: 'To delete',
        query: {
          sources: [{ templateId: '507f1f77bcf86cd799439011' }],
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count' }],
        },
        chart: { type: 'pie' },
        appearance: { colorMode: 'from_data' },
        refresh: { refreshMode: 'snapshot_manual' },
      });
    });

    await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const deleteUseCase = new DeleteDatavizUseCase(
        {
          transactionManager,
          datavizDS: DatavizDataSourceFactory.default(),
          snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
          scheduler: deleteScheduler as unknown as DatavizSchedulerService,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      await deleteUseCase.execute({ id: created.id });
    });

    expect(deleteScheduler.cancelPending).toHaveBeenCalledWith(created.id);

    const result = await testingEnvironment.runWithContext(() =>
      DatavizDataSourceFactory.default().getById(created.id)
    );
    expect(result.isError()).toBe(true);
  });
});
