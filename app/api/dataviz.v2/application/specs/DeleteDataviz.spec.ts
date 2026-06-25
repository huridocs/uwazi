import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
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
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          queryExecutor: DatavizFactory.queryExecutor(),
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler: createScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      return createUseCase.execute({
        name: 'To delete',
        dataSource: 'manual',
        query: {
          sources: [],
          dimensions: [],
          measures: [{ aggregation: 'count', countMode: 'all' }],
        },
        manualData: MANUAL_DATA_EXAMPLE,
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
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          scheduler: deleteScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      await deleteUseCase.execute({ id: created.id });
    });

    expect(deleteScheduler.cancelPending).toHaveBeenCalledWith(created.id);

    const result = await testingEnvironment.runWithContext(async () =>
      DatavizFactory.dataSource().getById(created.id)
    );
    expect(result.isError()).toBe(true);
  });
});
