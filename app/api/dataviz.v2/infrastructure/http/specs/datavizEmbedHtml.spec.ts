import type { Application, NextFunction } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import type { DatavizScheduler } from '#api/dataviz.v2/application/contracts/DatavizScheduler.js';
import { MANUAL_DATA_EXAMPLE } from '#shared/dataviz/manualData.js';
import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';
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
      name: 'Manual HTML embed',
      dataSource: 'manual',
      query: {
        sources: [],
        dimensions: [],
        measures: [{ aggregation: 'count', countMode: 'all' }],
      },
      manualData: MANUAL_DATA_EXAMPLE,
      chart: { type: 'bar', showTooltip: true, showLabels: true },
      appearance: { colorMode: 'from_data' },
      refresh: { refreshMode: 'snapshot_manual' },
    });
  });

describe('GET /embed/dataviz/:id HTML', () => {
  const app: Application = setUpApp(datavizRoutes, (req, _res, next) => {
    req.user = { _id: 'adminUser', role: 'admin' };
    next();
  });

  let datavizId = '';

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    const created = await createManualDataviz();
    datavizId = created.id;
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return self-contained HTML without the main app bundle', async () => {
    const response = await request(app).get(`/embed/dataviz/${datavizId}?locale=en`);

    expect(response.status).toBe(200);
    expect(String(response.headers['content-type']).includes('html')).toBe(true);
    expect(response.text).toContain('__DATAVIZ_CHART_OPTION__');
    expect(response.text).toContain('echarts.min.js');
    expect(response.text).toContain('dataviz-embed');
    expect(response.text).not.toContain('main.js');
    expect(response.text).not.toContain('/api/public/dataviz');
  });
});
