import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

import { searchRoutes } from '../routes';

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

describe('Sorting', () => {
  const factory = getFixturesFactory();
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await load(
      {
        templates: [factory.template('templateA', [])],
        entities: [
          factory.entity('A Entity', 'templateA', {}),
          factory.entity('c entity', 'templateA', {}),
          factory.entity('Z Entity', 'templateA', {}),
          factory.entity('j Entity', 'templateA', {}),
        ],
      },
      'search.v2.sorting'
    );
  });

  afterAll(async () => testingDB.disconnect());

  it('should sort by title', async () => {
    const query = {
      sort: 'title',
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { title: 'A Entity' },
      { title: 'c entity' },
      { title: 'j Entity' },
      { title: 'Z Entity' },
    ]);
  });
});
