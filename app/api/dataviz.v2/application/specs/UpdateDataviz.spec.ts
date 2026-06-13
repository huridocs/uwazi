import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';
import { UpdateDatavizUseCase } from '../useCases/UpdateDataviz.js';

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

const createSchedulerMock = () => ({
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
    const scheduler = createSchedulerMock();

    const created = await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const createUseCase = new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizDataSourceFactory.default(),
          scheduler: scheduler as unknown as DatavizSchedulerService,
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
          datavizDS: DatavizDataSourceFactory.default(),
          snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
          scheduler: updateScheduler as unknown as DatavizSchedulerService,
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
    expect(updateScheduler.schedule).toHaveBeenCalled();
  });
});
