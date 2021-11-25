/* eslint-disable max-statements */
import { Application } from 'express';
import request from 'supertest';

import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import entities from 'api/entities';
import { SearchQuery } from 'shared/types/SearchQueryType';

import { searchRoutes } from '../routes';
import { elasticTesting } from 'api/utils/elastic_testing';

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
      selectProperty: [factory.metadataValue('zFirst')],
    });
    const entityC = factory.entity('c Second title', 'templateA', {
      textProperty: [factory.metadataValue('D Last property')],
      numberProperty: [factory.metadataValue(-10)],
      selectProperty: [factory.metadataValue('aLast')],
    });
    const entityZ = factory.entity('Z Last title', 'templateA', {
      textProperty: [factory.metadataValue('a First property')],
      numberProperty: [factory.metadataValue(1)],
      selectProperty: [factory.metadataValue('mSecond')],
      inheritedProperty: [factory.metadataValue('inherited entity 1')],
    });
    const entityJ = factory.entity('j Third title', 'templateA', {
      textProperty: [factory.metadataValue('B Second property')],
      numberProperty: [factory.metadataValue(2)],
      selectProperty: [factory.metadataValue('yThird')],
      inheritedProperty: [factory.metadataValue('inherited entity 2')],
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
            factory.inherit('inheritedProperty', 'templateB', 'numberProperty'),
          ]),
          factory.template('templateB', [factory.property('numberProperty', 'numeric')]),
        ],
        dictionaries: [
          factory.thesauri('thesaurus', [
            ['zFirst', 'a First select'],
            ['mSecond', 'B Second select'],
            ['yThird', 'c Third select'],
            ['aLast', 'D Last select'],
          ]),
        ],
        entities: [
          entityA,
          entityC,
          entityZ,
          entityJ,
          factory.entity('inherited entity 1', 'templateB', {
            numberProperty: [factory.metadataValue(5)],
          }),
          factory.entity('inherited entity 2', 'templateB', {
            numberProperty: [factory.metadataValue(3)],
          }),
        ],
      },
      'search.v2.sorting'
    );

    await entities.save(entityA, { language: 'en', user: {} }, true);
    await entities.save(entityC, { language: 'en', user: {} }, true);
    await entities.save(entityZ, { language: 'en', user: {} }, true);
    await entities.save(entityJ, { language: 'en', user: {} }, true);

    await elasticTesting.refresh();
  });

  afterAll(async () => testingDB.disconnect());

  it('should sort by title', async () => {
    const query: SearchQuery = {
      sort: 'title',
      filter: { template: factory.id('templateA').toString() },
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
      filter: { template: factory.id('templateA').toString() },
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
      filter: { template: factory.id('templateA').toString() },
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

  it('should sort by metadata select property label', async () => {
    const query: SearchQuery = {
      sort: 'metadata.selectProperty',
      fields: ['metadata.selectProperty'],
      filter: { template: factory.id('templateA').toString() },
    };

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { metadata: { selectProperty: [{ label: 'a First select' }] } },
      { metadata: { selectProperty: [{ label: 'B Second select' }] } },
      { metadata: { selectProperty: [{ label: 'c Third select' }] } },
      { metadata: { selectProperty: [{ label: 'D Last select' }] } },
    ]);
  });

  it('should sort by inherited values', async () => {
    const query: SearchQuery = {
      sort: 'metadata.inheritedProperty.inheritedValue',
      fields: ['metadata.inheritedProperty'],
    };

    await elasticTesting.refresh();

    const { body } = await request(app)
      .get('/api/v2/entities')
      .query(query)
      .expect(200);

    expect(body.data).toMatchObject([
      { metadata: { inheritedProperty: [{ value: 'a First select' }] } },
      { metadata: { inheritedProperty: [{ value: 'B Second select' }] } },
      { metadata: { inheritedProperty: [{ value: 'c Third select' }] } },
      { metadata: { inheritedProperty: [{ value: 'D Last select' }] } },
    ]);
  });

  it.todo('we need factory.thesaurusValue that do not adds label');
  it.todo(
    'discuss if we want to sort by inherited properties exposing the structure or something more semantic'
  );
});
