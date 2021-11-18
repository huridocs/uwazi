import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import entities from 'api/entities';
import { SearchQuery } from 'shared/types/SearchQueryType';

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
    const entityA = factory.entity('A First title', 'templateA', {
      textProperty: [factory.metadataValue('c Third property')],
      numberProperty: [factory.metadataValue(100)],
      selectProperty: [factory.metadataValue('a First select')],
    });

    const entityC = factory.entity('c Second title', 'templateA', {
      textProperty: [factory.metadataValue('D Last property')],
      numberProperty: [factory.metadataValue(-10)],
      selectProperty: [factory.metadataValue('D Last select')],
    });
    const entityZ = factory.entity('Z Last title', 'templateA', {
      textProperty: [factory.metadataValue('a First property')],
      numberProperty: [factory.metadataValue(1)],
      selectProperty: [factory.metadataValue('B Second select')],
    });
    const entityJ = factory.entity('j Third title', 'templateA', {
      textProperty: [factory.metadataValue('B Second property')],
      numberProperty: [factory.metadataValue(2)],
      selectProperty: [factory.metadataValue('c Third select')],
    });

    await load(
      {
        templates: [
          factory.template('templateA', [
            factory.property('textProperty', 'text'),
            factory.property('numberProperty', 'numeric'),
            factory.property('selectProperty', 'select', {
              content: factory.id('thesaurus').toString(),
            }),
          ]),
        ],
        dictionaries: [
          factory.thesauri('thesaurus', [
            'a First select',
            'B Second select',
            'c Third select',
            'D Last select',
          ]),
        ],
        entities: [entityA, entityC, entityZ, entityJ],
      },
      'search.v2.sorting'
    );

    await entities.save(entityA, { language: 'en', user: {} }, true);
    await entities.save(entityC, { language: 'en', user: {} }, true);
    await entities.save(entityZ, { language: 'en', user: {} }, true);
    await entities.save(entityJ, { language: 'en', user: {} }, true);
  });

  afterAll(async () => testingDB.disconnect());

  it('should sort by title', async () => {
    const query: SearchQuery = {
      sort: 'title',
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { title: 'A First title' },
      { title: 'c Second title' },
      { title: 'j Third title' },
      { title: 'Z Last title' },
    ]);
  });

  it('should sort by metadata text property', async () => {
    const query: SearchQuery = {
      sort: '-metadata.textProperty',
      fields: ['metadata.textProperty'],
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { metadata: { textProperty: [{ value: 'D Last property' }] } },
      { metadata: { textProperty: [{ value: 'c Third property' }] } },
      { metadata: { textProperty: [{ value: 'B Second property' }] } },
      { metadata: { textProperty: [{ value: 'a First property' }] } },
    ]);
  });

  it('should sort by metadata number property', async () => {
    const query: SearchQuery = {
      sort: 'metadata.numberProperty',
      fields: ['metadata.numberProperty'],
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { metadata: { numberProperty: [{ value: -10 }] } },
      { metadata: { numberProperty: [{ value: 1 }] } },
      { metadata: { numberProperty: [{ value: 2 }] } },
      { metadata: { numberProperty: [{ value: 100 }] } },
    ]);
  });

  it('should sort by metadata select property', async () => {
    const query: SearchQuery = {
      sort: 'metadata.selectProperty',
      fields: ['metadata.selectProperty'],
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { metadata: { selectProperty: [{ value: 'a First select' }] } },
      { metadata: { selectProperty: [{ value: 'B Second select' }] } },
      { metadata: { selectProperty: [{ value: 'c Third select' }] } },
      { metadata: { selectProperty: [{ value: 'D Last select' }] } },
    ]);
  });

  it.todo('we need factory.thesaurusValue that do not adds label');
});
