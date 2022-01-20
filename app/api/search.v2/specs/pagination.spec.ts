import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

import { searchRoutes } from '../routes';
import { elasticTesting } from 'api/utils/elastic_testing';
import qs from 'qs';

const load = async (data: DBFixture, index?: string) =>
  testingEnvironment.setUp(
    {
      ...data,
      settings: [{ _id: db.id(), languages: [{ key: 'en', default: true }, { key: 'es' }] }],
      translations: [
        { locale: 'en', contexts: [] },
        { locale: 'es', contexts: [] },
      ],
    },
    index
  );

describe('Pagination', () => {
  const factory = getFixturesFactory();
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await load(
      {
        templates: [factory.template('templateA', []), factory.template('templateB', [])],
        entities: [
          factory.entity('First', 'templateA'),
          factory.entity('Second', 'templateA'),
          factory.entity('Third', 'templateA'),
          factory.entity('Fourth', 'templateA'),
          factory.entity('Fifth', 'templateB'),
          factory.entity('Sixth', 'templateB'),
        ],
      },
      'search.v2.pagination'
    );
    await elasticTesting.refresh();
  });

  afterAll(async () => testingDB.disconnect());

  it('should allow limiting the results and return required links', async () => {
    const { body } = await request(app)
      .get('/api/v2/entities')
      .query({ page: { limit: 2 } });

    expect(body.data).toMatchObject([{ title: 'First' }, { title: 'Second' }]);

    expect(body.links.first).toEqual(`/api/v2/entities?${qs.stringify({ page: { limit: 2 } })}`);
  });

  it('should paginate results', async () => {
    let { body } = await request(app)
      .get('/api/v2/entities')
      .query({ page: { limit: 2 } })
      .expect(200);

    ({ body } = await request(app).get(body.links.next).expect(200));
    expect(body.data).toMatchObject([{ title: 'Third' }, { title: 'Fourth' }]);

    ({ body } = await request(app).get(body.links.next).expect(200));
    expect(body.data).toMatchObject([{ title: 'Fifth' }, { title: 'Sixth' }]);

    ({ body } = await request(app).get(body.links.prev).expect(200));
    expect(body.data).toMatchObject([{ title: 'Third' }, { title: 'Fourth' }]);
  });

  it('should omit prev and next values on search limits', async () => {
    let { body } = await request(app)
      .get('/api/v2/entities')
      .query({ page: { limit: 2 } })
      .expect(200);

    expect(body.links.prev).toBeUndefined();

    ({ body } = await request(app).get(body.links.last).expect(200));

    expect(body.data).toMatchObject([{ title: 'Fifth' }, { title: 'Sixth' }]);
    expect(body.links.next).toBeUndefined();
  });

  it.todo('should be able to handle pagination with 10,000+ with relation "eq"');
});
