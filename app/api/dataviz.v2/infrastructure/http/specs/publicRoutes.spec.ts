import type { Application, NextFunction } from 'express';
import request from 'supertest';
import settings from '#api/settings/settings.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';
import { UpdateDatavizUseCase } from '#api/dataviz.v2/application/useCases/UpdateDataviz.js';
import datavizRoutes from '../routes.js';

jest.mock(
  '../../../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ default: true, key: 'en', label: 'English' }],
      private: false,
    },
  ],
};

const createManualDataviz = async () =>
  testingEnvironment.runWithContext(async () => {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const create = new CreateDatavizUseCase(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        datavizDS: DatavizFactory.dataSource(),
        snapshotsDS: DatavizFactory.snapshotsDataSource(),
        queryExecutor: DatavizFactory.queryExecutor(),
        templatesDS: TemplatesDataSourceFactory.default(),
        scheduler: { cancelPending: jest.fn(), schedule: jest.fn() } satisfies DatavizScheduler,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );

    return create.execute({
      name: 'Public embed chart',
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
  });

describe('public dataviz embed routes', () => {
  const app: Application = setUpApp(datavizRoutes);
  let datavizId = '';

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    const dataviz = await createManualDataviz();
    datavizId = dataviz.id;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return chart data and render fields for anonymous users on a public instance', async () => {
    const response = await request(app)
      .get(`/api/public/dataviz/${datavizId}/data`)
      .query({ locale: 'en' })
      .expect(200);

    expect(response.body.data.series[0].points[0].label).toBe('Category A');
    expect(response.body.chart.type).toBe('pie');
    expect(response.body.appearance.colorMode).toBe('theme');
  });

  it('should reject anonymous access when the instance is private', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    const response = await request(app).get(`/api/public/dataviz/${datavizId}/data`).expect(401);

    expect(response.body.error).toBe('Unauthorized');

    await settings.save({ ...current, private: false });
  });

  it('should allow anonymous access when embedPublic is enabled on a private instance', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const update = new UpdateDatavizUseCase(
        {
          transactionManager,
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          queryExecutor: DatavizFactory.queryExecutor(),
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler: { cancelPending: jest.fn(), schedule: jest.fn() } satisfies DatavizScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );
      const existing = await DatavizFactory.dataSource().getById(datavizId);
      await update.execute({ ...existing.getDataOrThrow().toDefinition(), embedPublic: true });
    });

    const response = await request(app)
      .get(`/api/public/dataviz/${datavizId}/data`)
      .query({ locale: 'en' })
      .expect(200);

    expect(response.body.data.series[0].points[0].label).toBe('Category A');

    await settings.save({ ...current, private: false });
  });

  it('should allow authenticated users on a private instance', async () => {
    const current = await settings.get();
    await settings.save({ ...current, private: true });

    const authedApp = setUpApp(datavizRoutes, (req, _res, next) => {
      req.user = { _id: 'adminUser', role: 'admin' };
      next();
    });

    const response = await request(authedApp)
      .get(`/api/public/dataviz/${datavizId}/data`)
      .query({ locale: 'en' })
      .expect(200);

    expect(response.body.data.series[0].points[0].label).toBe('Category A');

    await settings.save({ ...current, private: false });
  });

  it('should return 503 when a query chart has no snapshot', async () => {
    const queryChart = await testingEnvironment.runWithContext(async () => {
      const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
      const create = new CreateDatavizUseCase(
        {
          transactionManager,
          idGenerator: IdGeneratorFactory.default(),
          datavizDS: DatavizFactory.dataSource(),
          snapshotsDS: DatavizFactory.snapshotsDataSource(),
          queryExecutor: DatavizFactory.queryExecutor(),
          templatesDS: TemplatesDataSourceFactory.default(),
          scheduler: { cancelPending: jest.fn(), schedule: jest.fn() } satisfies DatavizScheduler,
        },
        { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
      );

      const created = await create.execute({
        name: 'Query without snapshot',
        query: {
          sources: [{ templateId: '507f1f77bcf86cd799439011' }],
          dimensions: [{ property: 'color', propertyType: 'select' }],
          measures: [{ aggregation: 'count', countMode: 'all' }],
        },
        chart: { type: 'pie' },
        appearance: { colorMode: 'theme' },
        refresh: { refreshMode: 'live' },
      });

      await DatavizFactory.snapshotsDataSource().deleteByDatavizId(created.id);
      return created;
    });

    const response = await request(app)
      .get(`/api/public/dataviz/${queryChart.id}/data`)
      .expect(503);

    expect(response.body.code).toBe('DATAVIZ_SNAPSHOT_UNAVAILABLE');
  });

  it('should return 503 when refresh is in progress', async () => {
    await testingEnvironment.runWithContext(async () => {
      await DatavizFactory.dataSource().setProcessing(datavizId, {
        active: true,
        startedAt: new Date().toISOString(),
      });
    });

    const response = await request(app).get(`/api/public/dataviz/${datavizId}/data`).expect(503);
    expect(response.body.code).toBe('DATAVIZ_PROCESSING');
  });
});
