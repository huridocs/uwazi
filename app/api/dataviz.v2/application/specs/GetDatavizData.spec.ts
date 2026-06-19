import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js';
import { DatavizQueryExecutorFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizQueryExecutorFactory.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';
import { DATAVIZ_DRAFT_ID } from '#shared/types/datavizSchema.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';
import { GetDatavizDataUseCase } from '../useCases/GetDatavizData.js';

const factory = getFixturesFactory();
const templateId = factory.id('carsTemplate');
const dateValue = 1_704_067_200_000;

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [
    {
      _id: templateId,
      name: 'Cars',
      properties: [
        {
          _id: factory.id('dateProp'),
          label: 'Date',
          name: 'date',
          type: 'date',
        },
      ],
      commonProperties: factory.commonProperties(),
    },
  ],
  entities: [
    {
      _id: factory.id('entity1'),
      sharedId: 'shared1',
      language: 'en',
      template: templateId,
      title: 'Car 1',
      published: true,
      metadata: { date: [{ value: dateValue }] },
    },
  ],
};

const dateDraftQuery = {
  sources: [{ templateId: templateId.toString() }],
  dimensions: [
    {
      property: 'date',
      propertyType: 'date' as const,
      bucketStrategy: 'range' as const,
      sort: 'count_desc' as const,
      maxBuckets: 8,
    },
  ],
  measures: [{ aggregation: 'count' as const, countMode: 'all' as const }],
  language: 'en',
  limit: 50,
};

const createSut = () =>
  testingEnvironment.runWithContext(() => {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    return {
      create: new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizDataSourceFactory.default(),
          scheduler: { cancelPending: jest.fn(), schedule: jest.fn() } as unknown as DatavizSchedulerService,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant, targetLanguage: 'en' }
      ),
      getData: new GetDatavizDataUseCase(
        {
          datavizDS: DatavizDataSourceFactory.default(),
          snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
          queryExecutor: DatavizQueryExecutorFactory.default(),
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      ),
    };
  });

describe('GetDatavizDataUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return stored manual data without executing a query', async () => {
    const { create, getData } = createSut();

    const dataviz = await create.execute({
      name: 'Manual chart',
      dataSource: 'manual',
      query: {
        sources: [],
        dimensions: [],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      manualData: MANUAL_DATA_EXAMPLE,
      chart: { type: 'pie' },
      appearance: { colorMode: 'theme' },
      refresh: { refreshMode: 'live' },
    });

    const dto = await getData.execute({ id: dataviz.id });

    expect(dto.series).toHaveLength(MANUAL_DATA_EXAMPLE.series.length);
    expect(dto.series[0]?.points[0]?.label).toBe('Category A');
  });

  it('should execute preview query for an unsaved draft without a persisted dataviz', async () => {
    const { getData } = createSut();

    const dto = await getData.execute({
      id: DATAVIZ_DRAFT_ID,
      draftQuery: dateDraftQuery,
    });

    expect(dto.series).toBeDefined();
    expect(dto.series[0]?.points.length).toBeGreaterThan(0);
  });

  it('should execute preview query without validating chart type against stored definition', async () => {
    const { create, getData } = createSut();

    const dataviz = await create.execute({
      name: 'Chart with pie',
      query: {
        sources: [{ templateId: templateId.toString() }],
        dimensions: [{ property: 'date', propertyType: 'date' }],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      chart: { type: 'pie' },
      appearance: { colorMode: 'from_data' },
      refresh: { refreshMode: 'live' },
    });

    const dto = await getData.execute({
      id: dataviz.id,
      draftQuery: dateDraftQuery,
    });

    expect(dto.series).toBeDefined();
    expect(dto.series[0]?.points.length).toBeGreaterThan(0);
  });
});
