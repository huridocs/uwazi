import { Application } from 'express';
import request from 'supertest';
import qs from 'qs';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';

import { setUpApp } from 'api/utils/testingRoutes';

import { searchRoutes } from '../routes';
import { getFixturesFactory } from '../../utils/fixturesFactory';

const load = async (data: DBFixture, index?: string) =>
  db.setupFixturesAndContext(
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

// FORMAT
// const query3 = {
//   filter: {
//     title: '',
//     'metadata.text': '',
//     'metadata.multiSelect': { values: [], operator: 'and' },
//   },
// };

describe('Metadata filters', () => {
  const factory = getFixturesFactory();
  const app: Application = setUpApp(searchRoutes);

  afterAll(async () => testingDB.disconnect());

  it('should filter by the title', async () => {
    await load(
      {
        entities: [factory.entity('Entity 1', 'T1'), factory.entity('Entity 2', 'T1')],
      },
      'search.v2.metadata_filters'
    );

    const query = {
      filter: {
        title: 'entity 1',
      },
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([{ title: 'Entity 1' }]);
  });
});
