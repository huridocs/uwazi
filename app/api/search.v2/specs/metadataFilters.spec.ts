import { Application } from 'express';
import request from 'supertest';
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
//     'metadata.numeric': 42,
//     'metadata.numeric': {from: 15, to: 25},
//   },
// };

describe('Metadata filters', () => {
  const factory = getFixturesFactory();
  const app: Application = setUpApp(searchRoutes);

  beforeAll(async () => {
    await load(
      {
        templates: [
          factory.template('templateA', [
            factory.property('multiselect', 'multiselect'),
            factory.property('selectPropertyName', 'select'),
            factory.property('numericPropertyName', 'numeric'),
            factory.property('datePropertyName', 'multidate'),
            factory.property('textPropertyName', 'text'),
          ]),
        ],
        entities: [
          factory.entity('Entity 1', 'templateA', {
            multiselect: [
              factory.metadataValue('thesaurusId1'),
              factory.metadataValue('thesaurusId3'),
            ],
            selectPropertyName: [factory.metadataValue('thesaurusId1')],
            numericPropertyName: [factory.metadataValue(42)],
            datePropertyName: [factory.metadataValue(9001), factory.metadataValue(42)],
            textPropertyName: [factory.metadataValue('A small text value')],
          }),
          factory.entity('Entity 2', 'templateA', {
            multiselect: [
              factory.metadataValue('thesaurusId2'),
              factory.metadataValue('thesaurusId3'),
            ],
            selectPropertyName: [factory.metadataValue('thesaurusId2')],
            numericPropertyName: [factory.metadataValue(13)],
            datePropertyName: [factory.metadataValue(8999)],
            textPropertyName: [factory.metadataValue('Very different value')],
          }),
          factory.entity('Entity 3', 'templateA', {
            numericPropertyName: [factory.metadataValue(5)],
            textPropertyName: [factory.metadataValue('Another small text')],
          }),
        ],
      },
      'search.v2.metadata_filters'
    );
  });

  afterAll(async () => testingDB.disconnect());

  describe('Select and Multiselect filters', () => {
    it.each([{ filterValue: 'thesaurusId1' }, { filterValue: { values: ['thesaurusId1'] } }])(
      'should filter by one property and one value',
      async ({ filterValue }) => {
        const query = {
          filter: {
            'metadata.selectPropertyName': filterValue,
          },
        };

        const { body } = await request(app)
          .get('/api/v2/entities')
          .query(query)
          .expect(200);
        expect(body.data).toMatchObject([{ title: 'Entity 1' }]);
      }
    );

    it.each([
      { filterValue: { values: ['thesaurusId1', 'thesaurusId2'] } },
      { filterValue: { values: ['thesaurusId1', 'thesaurusId2'], operator: 'OR' } },
    ])('should filter by one property and multiple values', async ({ filterValue }) => {
      const query = {
        filter: {
          'metadata.selectPropertyName': filterValue,
        },
      };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);
      expect(body.data).toMatchObject([{ title: 'Entity 1' }, { title: 'Entity 2' }]);
    });

    it.each([
      { filterValue: 'thesaurusId2' },
      { filterValue: { values: ['thesaurusId3', 'thesaurusId2'], operator: 'AND' } },
    ])('should filter by the other metadata property', async ({ filterValue }) => {
      const query = {
        filter: {
          'metadata.multiselect': filterValue,
        },
      };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);
      expect(body.data).toMatchObject([{ title: 'Entity 2' }]);
    });
  });

  describe('Numeric range filter', () => {
    it.each([
      { filterValue: 42, expected: [{ title: 'Entity 1' }] },
      { filterValue: { from: 10, to: 25 }, expected: [{ title: 'Entity 2' }] },
      { filterValue: { to: 25 }, expected: [{ title: 'Entity 2' }, { title: 'Entity 3' }] },
      { filterValue: { from: 25 }, expected: [{ title: 'Entity 1' }] },
    ])('should filter by numeric properties -> %o', async ({ filterValue, expected }) => {
      const query = {
        filter: {
          'metadata.numericPropertyName': filterValue,
        },
      };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);

      expect(body.data).toMatchObject(expected);
    });
  });

  describe('Date range filters', () => {
    it('should filter by date property', async () => {
      const query = {
        filter: {
          'metadata.datePropertyName': { from: 9000 },
        },
      };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);

      expect(body.data).toMatchObject([{ title: 'Entity 1' }]);
    });
  });

  describe('Property-specific text filters', () => {
    it('should filter by exact text value', async () => {
      const query = { filter: { 'metadata.textPropertyName': 'small' } };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);

      expect(body.data).toMatchObject([{ title: 'Entity 1' }, { title: 'Entity 3' }]);
    });

    it('should filter by string expressions', async () => {
      const query = {
        filter: { 'metadata.textPropertyName': '?alu*' },
      };

      const { body } = await request(app)
        .get('/api/v2/entities')
        .query(query)
        .expect(200);

      expect(body.data).toMatchObject([{ title: 'Entity 1' }, { title: 'Entity 2' }]);
    });
  });

  it('', () => {
    throw new Error('Validate query sintax for text queries');
  });
});
