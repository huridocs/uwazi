import { Application } from 'express';
import request from 'supertest';
import qs from 'qs';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';

import { setUpApp } from 'api/utils/testingRoutes';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
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

  it('should filter by the one metadata property', async () => {
    await load(
      {
        templates: [
          factory.template('templateA', [factory.property('selectPropertyName', 'select')]),
        ],
        entities: [
          factory.entity('Entity 1', 'templateA', {
            selectPropertyName: [factory.metadataValue('thesaurusId1')],
          }),
          factory.entity('Entity 2', 'templateA', {
            selectPropertyName: [factory.metadataValue('thesaurusId2')],
          }),
        ],
      },
      'search.v2.metadata_filters'
    );

    const query = {
      filter: {
        'metadata.selectPropertyName': 'thesaurusId1',
      },
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);
    expect(body.data).toMatchObject([{ title: 'Entity 1' }]);
  });

  it('should filter by the other metadata property', async () => {
    await load(
      {
        templates: [
          factory.template('templateA', [factory.property('multiselect', 'multiselect')]),
        ],
        entities: [
          factory.entity('Entity 1', 'templateA', {
            multiselect: [factory.metadataValue('thesaurusId1')],
          }),
          factory.entity('Entity 2', 'templateA', {
            multiselect: [factory.metadataValue('thesaurusId2')],
          }),
        ],
      },
      'search.v2.metadata_filters'
    );

    const query = {
      filter: {
        'metadata.multiselect': 'thesaurusId2',
      },
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);
    expect(body.data).toMatchObject([{ title: 'Entity 2' }]);
  });
});
