import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import settings from '#api/settings/settings.js';
import { User } from '#api/users.v2/model/User.js';
import { DatavizDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizDataSourceFactory.js';
import { DatavizSnapshotsDataSourceFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js';
import { DatavizQueryExecutorFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizQueryExecutorFactory.js';
import { DatavizSchedulerService } from '#api/dataviz.v2/infrastructure/services/DatavizSchedulerService.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
import {
  DatavizNotFoundError,
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
  DatavizUnauthorizedError,
} from '#api/dataviz.v2/domain/errors.js';
import { CreateDatavizUseCase } from '../useCases/CreateDataviz.js';
import { GetPublicDatavizEmbedUseCase } from '../useCases/GetPublicDatavizEmbed.js';

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ default: true, key: 'en', label: 'English' }],
      private: false,
    },
  ],
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
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      ),
      getPublicEmbed: (actor = ExecutionContext.actor) => ({
        execute: (input: { id: string }) =>
          testingEnvironment.runWithContext(() => {
            const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
            const useCase = new GetPublicDatavizEmbedUseCase(
              {
                datavizDS: DatavizDataSourceFactory.default(),
                snapshotsDS: DatavizSnapshotsDataSourceFactory.default(),
                queryExecutor: DatavizQueryExecutorFactory.default(),
                settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
              },
              { actor, tenant: ExecutionContext.tenant, targetLanguage: 'en' }
            );
            return useCase.execute(input);
          }),
      }),
      datavizDS: DatavizDataSourceFactory.default(),
    };
  });

describe('GetPublicDatavizEmbedUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return embed payload for a published visualization', async () => {
    const { create, getPublicEmbed } = createSut();
    const dataviz = await create.execute({
      name: 'Published embed',
      status: 'published',
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

    const payload = await getPublicEmbed().execute({ id: dataviz.id });

    expect(payload.data.series[0].points[0].label).toBe('Category A');
    expect(payload.chart.type).toBe('pie');
    expect(payload.sources).toEqual([]);
  });

  it('should reject draft visualizations', async () => {
    const { create, getPublicEmbed } = createSut();
    const dataviz = await create.execute({
      name: 'Draft embed',
      status: 'draft',
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

    await expect(getPublicEmbed().execute({ id: dataviz.id })).rejects.toThrow(DatavizNotFoundError);
  });

  it('should reject anonymous access on private instances', async () => {
    const { create, getPublicEmbed } = createSut();
    const dataviz = await create.execute({
      name: 'Private instance chart',
      status: 'published',
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

    const current = await settings.get();
    await settings.save({ ...current, private: true });

    await expect(
      getPublicEmbed(User.createFrom(null)).execute({ id: dataviz.id })
    ).rejects.toThrow(DatavizUnauthorizedError);

    await settings.save({ ...current, private: false });
  });

  it('should allow authenticated users on private instances', async () => {
    const { create, getPublicEmbed } = createSut();
    const dataviz = await create.execute({
      name: 'Private auth chart',
      status: 'published',
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

    const current = await settings.get();
    await settings.save({ ...current, private: true });

    const payload = await getPublicEmbed(User.createFrom({ _id: 'admin1', role: 'admin' })).execute({
      id: dataviz.id,
    });

    expect(payload.data.series).toHaveLength(1);

    await settings.save({ ...current, private: false });
  });

  it('should reject when snapshot refresh is in progress', async () => {
    const { create, getPublicEmbed, datavizDS } = createSut();
    const dataviz = await create.execute({
      name: 'Processing chart',
      status: 'published',
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

    await datavizDS.setProcessing(dataviz.id, { active: true, startedAt: new Date().toISOString() });

    await expect(getPublicEmbed().execute({ id: dataviz.id })).rejects.toThrow(DatavizProcessingError);
  });

  it('should reject live query charts without a snapshot on the public path', async () => {
    const { create, getPublicEmbed } = createSut();
    const dataviz = await create.execute({
      name: 'Live without snapshot',
      status: 'published',
      query: {
        sources: [{ templateId: 'missing' }],
        dimensions: [{ property: 'title', propertyType: 'text' }],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      chart: { type: 'pie' },
      appearance: { colorMode: 'theme' },
      refresh: { refreshMode: 'live' },
    });

    await expect(getPublicEmbed().execute({ id: dataviz.id })).rejects.toThrow(
      DatavizSnapshotUnavailableError
    );
  });

  it('should serve snapshot data for live charts on the public path without executing queries', async () => {
    const executeSpy = jest.fn();
    const { create } = createSut();
    const dataviz = await create.execute({
      name: 'Live with snapshot',
      status: 'published',
      query: {
        sources: [{ templateId: 'missing' }],
        dimensions: [{ property: 'title', propertyType: 'text' }],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      chart: { type: 'pie' },
      appearance: { colorMode: 'theme' },
      refresh: { refreshMode: 'live' },
    });

    const payload = await testingEnvironment.runWithContext(async () => {
      const datavizDS = DatavizDataSourceFactory.default();
      const persisted = (await datavizDS.getById(dataviz.id)).getDataOrThrow();
      const snapshotsDS = DatavizSnapshotsDataSourceFactory.default();
      await snapshotsDS.upsert({
        datavizId: dataviz.id,
        queryHash: persisted.queryHash,
        payload: {
          series: [{ points: [{ label: 'Snapshot only', value: 42 }] }],
        },
        generatedAt: new Date(),
      });

      const useCase = new GetPublicDatavizEmbedUseCase(
        {
          datavizDS,
          snapshotsDS,
          queryExecutor: { execute: executeSpy } as any,
          settingsDS: SettingsDataSourceFactory.default({
            transactionManager: ExecutionContext.transactionManager as MongoTransactionManager,
          }),
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant, targetLanguage: 'en' }
      );

      return useCase.execute({ id: dataviz.id });
    });

    expect(executeSpy).not.toHaveBeenCalled();
    expect(payload.data.series[0].points[0].label).toBe('Snapshot only');
  });
});
