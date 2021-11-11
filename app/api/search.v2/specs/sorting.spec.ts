import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';

import { searchRoutes } from '../routes';
import entities from 'api/entities';

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
    const entityA = factory.entity('A Entity', 'templateA', {
      textProperty: [factory.metadataValue('property c')],
      numberProperty: [factory.metadataValue(100)],
      selectProperty: [factory.metadataValue('a')],
    });

    const entityC = factory.entity('c entity', 'templateA', {
      textProperty: [factory.metadataValue('property D')],
      numberProperty: [factory.metadataValue(-10)],
      selectProperty: [factory.metadataValue('D')],
    });
    const entityZ = factory.entity('Z Entity', 'templateA', {
      textProperty: [factory.metadataValue('property a')],
      numberProperty: [factory.metadataValue(1)],
      selectProperty: [factory.metadataValue('B')],
    });
    const entityJ = factory.entity('j Entity', 'templateA', {
      textProperty: [factory.metadataValue('property B')],
      numberProperty: [factory.metadataValue(2)],
      selectProperty: [factory.metadataValue('c')],
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
        dictionaries: [factory.thesauri('thesaurus', ['a', 'B', 'c', 'D'])],
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

  it('should sort by metadata text property', async () => {
    const query = {
      sort: '-metadata.textProperty',
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { title: 'c entity' },
      { title: 'A Entity' },
      { title: 'j Entity' },
      { title: 'Z Entity' },
    ]);
  });

  it('should sort by metadata number property', async () => {
    const query = {
      sort: 'metadata.numberProperty',
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { title: 'c entity' },
      { title: 'Z Entity' },
      { title: 'j Entity' },
      { title: 'A Entity' },
    ]);
  });

  it('should sort by metadata select property', async () => {
    const query = {
      sort: 'metadata.selectProperty',
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    fail('this should be failing');
    expect(body.data).toMatchObject([
      { title: 'A Entity' },
      { title: 'Z Entity' },
      { title: 'j Entity' },
      { title: 'c entity' },
    ]);
  });

  it.todo('we need factory.thesaurusValue that do not adds label')
  it.todo('we do not want factory.metadataValue to add a label')
  it.todo('we want to improve readability of tests (not use title when ordering by other props)')
});
