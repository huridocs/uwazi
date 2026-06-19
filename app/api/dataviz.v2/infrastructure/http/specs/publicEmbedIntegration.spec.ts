import type { Application, NextFunction } from 'express';
import request from 'supertest';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import datavizRoutes from '../routes.js';

jest.mock(
  '../../../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

const factory = getFixturesFactory();
const templateId = factory.id('carsTemplate');

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ default: true, key: 'en', label: 'English' }],
      private: false,
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'Cars',
      color: '#4A90D9',
      properties: [
        factory.property('registration_date', 'date', { label: 'Registration date' }),
        factory.property('engine_size', 'numeric', { label: 'Engine size' }),
      ],
      commonProperties: factory.commonProperties(),
    },
  ],
  entities: [
    {
      _id: factory.id('car1'),
      sharedId: 'car_shared_1',
      language: 'en',
      template: templateId,
      title: 'Car 1',
      published: true,
      metadata: {
        registration_date: [{ value: 799744562 }],
        engine_size: [{ value: 1.4 }],
      },
    },
    {
      _id: factory.id('car2'),
      sharedId: 'car_shared_2',
      language: 'en',
      template: templateId,
      title: 'Car 2',
      published: true,
      metadata: {
        registration_date: [{ value: 804863301 }],
        engine_size: [{ value: 1.5 }],
      },
    },
    {
      _id: factory.id('car3'),
      sharedId: 'car_shared_3',
      language: 'en',
      template: templateId,
      title: 'Car 3',
      published: true,
      metadata: {
        registration_date: [{ value: 804863301 }],
        engine_size: [{ value: 2.0 }],
      },
    },
  ],
};

const scatterQueryChart = {
  name: 'Scatter embed integration',
  query: {
    sources: [{ templateId: templateId.toString(), alias: 'cars' }],
    dimensions: [
      {
        property: 'registration_date',
        propertyType: 'date',
        bucketStrategy: 'date_histogram',
        dateInterval: 'day',
        sort: 'key_asc',
        maxBuckets: 10,
      },
      {
        property: 'engine_size',
        propertyType: 'numeric',
        bucketStrategy: 'terms',
        sort: 'key_asc',
        maxBuckets: 10,
      },
    ],
    measures: [{ aggregation: 'count', countMode: 'all' }],
    language: 'en',
    limit: 50,
  },
  chart: { type: 'scatter', showTooltip: true, showLabels: false },
  appearance: { colorMode: 'from_data' },
  refresh: { refreshMode: 'snapshot_manual' },
};

describe('public dataviz embed integration', () => {
  const app: Application = setUpApp(datavizRoutes, (req, _res, next) => {
    req.user = { _id: 'adminUser', role: 'admin' };
    next();
  });

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a query chart, persist snapshot on save, and return embed payload', async () => {
    const createResponse = await request(app)
      .post('/api/dataviz')
      .send(scatterQueryChart)
      .expect(200);

    const datavizId = createResponse.body.id as string;
    expect(datavizId).toBeDefined();
    expect(createResponse.body.chart.type).toBe('scatter');
    expect(createResponse.body.refresh.lastRefreshedAt).toBeDefined();

    const embedResponse = await request(app)
      .get(`/api/public/dataviz/${datavizId}/data`)
      .query({ locale: 'en' })
      .expect(200);

    expect(embedResponse.body.chart.type).toBe('scatter');
    expect(embedResponse.body.data.series).toHaveLength(1);
    expect(embedResponse.body.data.series[0].points.length).toBeGreaterThan(0);

    const firstPoint = embedResponse.body.data.series[0].points[0];
    expect(firstPoint.value).toBeGreaterThan(0);
    expect(firstPoint.breakdown?.length).toBeGreaterThan(0);
    expect(firstPoint.breakdown[0].value).toBeGreaterThan(0);
    expect(embedResponse.body.data.meta.totalEntities).toBeGreaterThan(0);

    const breakdownValues = embedResponse.body.data.series[0].points.flatMap(
      (point: { breakdown?: Array<{ value: number }> }) => point.breakdown ?? []
    );
    expect(breakdownValues.every((item: { value: number }) => item.value > 0)).toBe(true);
  });

  it('should return 503 when query chart snapshot was removed', async () => {
    const createResponse = await request(app)
      .post('/api/dataviz')
      .send({ ...scatterQueryChart, name: 'Scatter without snapshot' })
      .expect(200);

    const datavizId = createResponse.body.id as string;

    await testingEnvironment.runWithContext(async () => {
      const snapshotsDS = (
        await import('#api/dataviz.v2/infrastructure/factories/DatavizSnapshotsDataSourceFactory.js')
      ).DatavizSnapshotsDataSourceFactory.default();
      await snapshotsDS.deleteByDatavizId(datavizId);
    });

    const embedResponse = await request(app)
      .get(`/api/public/dataviz/${datavizId}/data`)
      .query({ locale: 'en' })
      .expect(503);

    expect(embedResponse.body.code).toBe('DATAVIZ_SNAPSHOT_UNAVAILABLE');
  });
});
