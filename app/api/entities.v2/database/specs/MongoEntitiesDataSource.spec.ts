import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { GraphQueryResult } from 'api/relationships.v2/model/GraphQueryResult';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { MetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { MongoEntitiesDataSource } from '../MongoEntitiesDataSource';

const factory = getFixturesFactory();

const entityInLanguages =
  (langs: string[]) =>
  (id: string, template?: string, metadata?: MetadataSchema, props?: EntitySchema) =>
    langs.map(lang => factory.entity(id, template, metadata, { language: lang, ...props }));

const fixtures = {
  entities: [
    ...entityInLanguages(['en', 'pt'])('entity1', 'template1'),
    ...entityInLanguages(['en', 'pt'])('entity2', 'template1'),
    ...entityInLanguages(['en', 'pt'])(
      'entity3',
      'template1',
      {
        relProp1: [{ value: 'valid value', label: 'valid label' }],
        numeric: [{ value: 1 }],
      },
      { obsoleteMetadata: ['relProp3'] }
    ),
    ...entityInLanguages(['en', 'pt'])(
      'entity4',
      'template1',
      {
        relProp1: [{ value: 'valid value', label: 'valid label' }],
        numeric: [{ value: 1 }],
      },
      { obsoleteMetadata: ['relProp4'] }
    ),
  ],
  templates: [
    factory.template('template1', [
      { type: 'newRelationship', name: 'relProp1', label: 'relProp1', query: [{ match: [{}] }] },
      { type: 'newRelationship', name: 'relProp2', label: 'relProp2', query: [{ match: [{}] }] },
      { type: 'newRelationship', name: 'relProp3', label: 'relProp3', query: [{ match: [{}] }] },
      { type: 'newRelationship', name: 'relProp4', label: 'relProp4', query: [{ match: [{}] }] },
    ]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('Relationship fields caching strategy', () => {
  describe('When invalidating some field cache', () => {
    it('should invalidate the cache for the provided entity-property pairs in all languages', async () => {
      const relationshipsDsMock = partialImplementation<MongoRelationshipsDataSource>({});
      const settingsDsMock = partialImplementation<MongoSettingsDataSource>({});
      const ds = new MongoEntitiesDataSource(
        getConnection(),
        relationshipsDsMock,
        settingsDsMock,
        new MongoTransactionManager(getClient())
      );

      await ds.markMetadataAsChanged([
        { sharedId: 'entity1', propertiesToBeMarked: ['relProp1'] },
        { sharedId: 'entity2', propertiesToBeMarked: ['relProp2'] },
      ]);

      const entities = await testingDB.mongodb?.collection('entities').find({}).toArray();
      expect(entities).toMatchObject([
        { sharedId: 'entity1', language: 'en', obsoleteMetadata: ['relProp1'] },
        { sharedId: 'entity1', language: 'pt', obsoleteMetadata: ['relProp1'] },
        { sharedId: 'entity2', language: 'en', obsoleteMetadata: ['relProp2'] },
        { sharedId: 'entity2', language: 'pt', obsoleteMetadata: ['relProp2'] },
        { sharedId: 'entity3', language: 'en', obsoleteMetadata: ['relProp3'] },
        { sharedId: 'entity3', language: 'pt', obsoleteMetadata: ['relProp3'] },
        { sharedId: 'entity4', language: 'en', obsoleteMetadata: ['relProp4'] },
        { sharedId: 'entity4', language: 'pt', obsoleteMetadata: ['relProp4'] },
      ]);
    });
  });

  describe('When loading some entities', () => {
    let entities: any[];
    beforeEach(async () => {
      let counter = 0;
      const relationshipsDsMock = partialImplementation<MongoRelationshipsDataSource>({
        getByQuery(_query, lang) {
          counter += 1;
          return partialImplementation<MongoResultSet<any, GraphQueryResult>>({
            all: async () =>
              Promise.resolve([
                new GraphQueryResult([
                  {
                    sharedId: `calculated${counter}-${lang}`,
                    title: `calculated${counter}-${lang}`,
                  },
                ]),
              ]),
          });
        },
      });
      const settingsDsMock = partialImplementation<MongoSettingsDataSource>({});
      const ds = new MongoEntitiesDataSource(
        getConnection(),
        relationshipsDsMock,
        settingsDsMock,
        new MongoTransactionManager(getClient())
      );

      entities = await ds.getByIds(['entity3', 'entity4']).all();
    });

    it('should use the cached values', async () => {
      expect(entities).toMatchObject([
        {
          sharedId: 'entity3',
          language: 'en',
          metadata: {
            relProp1: [{ value: 'valid value', label: 'valid label' }],
          },
        },
        {
          sharedId: 'entity3',
          language: 'pt',
          metadata: {
            relProp1: [{ value: 'valid value', label: 'valid label' }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'en',
          metadata: {
            relProp1: [{ value: 'valid value', label: 'valid label' }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'pt',
          metadata: {
            relProp1: [{ value: 'valid value', label: 'valid label' }],
          },
        },
      ]);
    });

    it('should recalculate the invalidated values', async () => {
      expect(entities).toMatchObject([
        {
          sharedId: 'entity3',
          language: 'en',
          metadata: {
            relProp3: [{ value: 'calculated1-en', label: 'calculated1-en' }],
          },
        },
        {
          sharedId: 'entity3',
          language: 'pt',
          metadata: {
            relProp3: [{ value: 'calculated2-pt', label: 'calculated2-pt' }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'en',
          metadata: {
            relProp4: [{ value: 'calculated3-en', label: 'calculated3-en' }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'pt',
          metadata: {
            relProp4: [{ value: 'calculated4-pt', label: 'calculated4-pt' }],
          },
        },
      ]);
    });

    it('should leave other metadata properties untouched', async () => {
      const dbEntities = await testingDB.mongodb
        ?.collection('entities')
        .find({ sharedId: { $in: ['entity3', 'entity4'] } })
        .toArray();
      expect(dbEntities).toMatchObject([
        {
          sharedId: 'entity3',
          language: 'en',
          metadata: {
            numeric: [{ value: 1 }],
          },
        },
        {
          sharedId: 'entity3',
          language: 'pt',
          metadata: {
            numeric: [{ value: 1 }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'en',
          metadata: {
            numeric: [{ value: 1 }],
          },
        },
        {
          sharedId: 'entity4',
          language: 'pt',
          metadata: {
            numeric: [{ value: 1 }],
          },
        },
      ]);
    });
  });
});

describe('When checking for the existence of entities', () => {
  const cases = [
    { ids: [], expected: true },
    { ids: ['entity1'], expected: true },
    { ids: ['entity1', 'entity2'], expected: true },
    { ids: ['entity1', 'non-existing'], expected: false },
    { ids: ['non-existing'], expected: false },
  ];

  it.each(cases)(
    'should return $expected checking for sharedIds in $ids',
    async ({ ids, expected }) => {
      const ds = new MongoEntitiesDataSource(
        getConnection(),
        partialImplementation<MongoRelationshipsDataSource>({}),
        partialImplementation<MongoSettingsDataSource>({
          async getLanguageKeys() {
            return Promise.resolve(['en', 'pt']);
          },
        }),
        new MongoTransactionManager(getClient())
      );

      expect(await ds.entitiesExist(ids)).toBe(expected);
    }
  );
});

it('should return the sharedIds of the entities that have a particular id within their denormalized values in a metatata prop', async () => {
  const ds = new MongoEntitiesDataSource(
    getConnection(),
    partialImplementation<MongoRelationshipsDataSource>({}),
    partialImplementation<MongoSettingsDataSource>({
      async getLanguageKeys() {
        return Promise.resolve(['en', 'pt']);
      },
    }),
    new MongoTransactionManager(getClient())
  );

  expect(
    await ds
      .getByDenormalizedId(['relProp1', 'relProp2', 'relProp3', 'relProp4'], ['valid value'])
      .all()
  ).toEqual(['entity3', 'entity3', 'entity4', 'entity4']);
});

it('should update the label of the denormalized value in all related entities', async () => {
  const ds = new MongoEntitiesDataSource(
    getConnection(),
    partialImplementation<MongoRelationshipsDataSource>({}),
    partialImplementation<MongoSettingsDataSource>({
      async getLanguageKeys() {
        return Promise.resolve(['en', 'pt']);
      },
    }),
    new MongoTransactionManager(getClient())
  );

  await ds.updateDenormalizedTitle(
    ['relProp1', 'relProp2', 'relProp3', 'relProp4'],
    'valid value',
    'en',
    'new label'
  );

  const entities = await testingDB.mongodb
    ?.collection('entities')
    .find({ sharedId: { $in: ['entity3', 'entity4'] } })
    .toArray();

  expect(entities).toMatchObject([
    {
      sharedId: 'entity3',
      language: 'en',
      metadata: {
        relProp1: [{ value: 'valid value', label: 'new label' }],
      },
    },
    {
      sharedId: 'entity3',
      language: 'pt',
      metadata: {
        relProp1: [{ value: 'valid value', label: 'valid label' }],
      },
    },
    {
      sharedId: 'entity4',
      language: 'en',
      metadata: {
        relProp1: [{ value: 'valid value', label: 'new label' }],
      },
    },
    {
      sharedId: 'entity4',
      language: 'pt',
      metadata: {
        relProp1: [{ value: 'valid value', label: 'valid label' }],
      },
    },
  ]);
});
