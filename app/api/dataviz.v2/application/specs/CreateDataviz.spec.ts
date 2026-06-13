import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';

const createSut = (scheduler: DatavizSchedulerService) =>
  testingEnvironment.runWithContext(() => {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return new CreateDatavizUseCase(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        datavizDS: DatavizDataSourceFactory.default(),
        scheduler,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
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

  it('should persist a dataviz definition', async () => {
    const schedule = jest.fn();
    const sut = createSut({ cancelPending: jest.fn(), schedule } as unknown as DatavizSchedulerService);

    const dataviz = await sut.execute(baseInput);

    expect(dataviz.id).toBeDefined();
    expect(dataviz.name).toBe('Cars by color');
    expect(schedule).not.toHaveBeenCalled();
  });

  it('should reject query visualizations without dimensions unless using count metric', async () => {
    const schedule = jest.fn();
    const sut = createSut({ cancelPending: jest.fn(), schedule } as unknown as DatavizSchedulerService);

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

  it('should schedule refresh job for snapshot_scheduled mode', async () => {
    const schedule = jest.fn();
    const sut = createSut({ cancelPending: jest.fn(), schedule } as unknown as DatavizSchedulerService);

    await sut.execute({
      ...baseInput,
      name: 'Scheduled chart',
      refresh: { refreshMode: 'snapshot_scheduled', schedule: 'daily', scheduleTime: '02:00' },
    });

    expect(schedule).toHaveBeenCalled();
  });
});
