import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import testingDB from 'api/utils/testing_db';
import { EntityRelationshipsUpdateService } from '../EntityRelationshipsUpdateService';

const factory = getFixturesFactory();

const fixtures = {
  templates: [
    factory.template('template1', [
      factory.property('relProp1', 'newRelationship', {
        query: [
          {
            types: [factory.id('relType1')],
            direction: 'out',
            match: [
              {
                templates: [factory.id('template2')],
              },
            ],
          },
        ],
      }),
      factory.property('relProp2', 'newRelationship', {
        query: [
          {
            types: [factory.id('relType1')],
            direction: 'in',
            match: [
              {
                templates: [factory.id('template2')],
              },
            ],
          },
        ],
        denormalizedProperty: 'text',
      }),
      factory.property('numeric', 'numeric'),
    ]),
    factory.template('template2', [
      factory.property('text', 'text'),
      factory.property('relProp3', 'newRelationship', {
        query: [
          {
            types: [factory.id('relType2')],
            direction: 'out',
            match: [
              {
                templates: [factory.id('template1')],
              },
            ],
          },
        ],
      }),
    ]),
  ],
  entities: [
    factory.entity(
      'entity1-1',
      'template1',
      { numeric: [{ value: 1 }] },
      { obsoleteMetadata: ['relProp1', 'relProp2'] }
    ),
    factory.entity(
      'entity2-1',
      'template1',
      { numeric: [{ value: 2 }] },
      { obsoleteMetadata: ['relProp1', 'relProp2'] }
    ),
    factory.entity('entity1-2', 'template2', {
      text: [{ value: 'some text' }],
    }),
    factory.entity('entity2-2', 'template2', {
      text: [],
    }),
    factory.entity('entity3-2', 'template2', {}, { obsoleteMetadata: ['relProp3'] }),
  ],
  relationships: [
    {
      _id: factory.id('rel1'),
      from: { entity: 'entity1-1' },
      to: { entity: 'entity1-2' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel2'),
      from: { entity: 'entity1-1' },
      to: { entity: 'entity2-2' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel3'),
      from: { entity: 'entity2-1' },
      to: { entity: 'entity3-2' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel4'),
      from: { entity: 'entity1-2' },
      to: { entity: 'entity1-1' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel5'),
      from: { entity: 'entity2-2' },
      to: { entity: 'entity1-1' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel6'),
      from: { entity: 'entity3-2' },
      to: { entity: 'entity1-1' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel7'),
      from: { entity: 'entity3-2' },
      to: { entity: 'entity1-1' },
      type: factory.id('relType2'),
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

function buildService() {
  const transactionManager = new MongoTransactionManager(getClient());
  const settingsDataSource = new MongoSettingsDataSource(getConnection(), transactionManager);
  const templateDataSource = new MongoTemplatesDataSource(getConnection(), transactionManager);
  const entityDataSource = new MongoEntitiesDataSource(
    getConnection(),
    templateDataSource,
    settingsDataSource,
    transactionManager
  );
  const relationshipsDataSource = new MongoRelationshipsDataSource(
    getConnection(),
    transactionManager
  );

  return new EntityRelationshipsUpdateService(
    entityDataSource,
    templateDataSource,
    relationshipsDataSource
  );
}

describe('when recalculating the relationships fields for some entities', () => {
  const ids = ['entity1-1', 'entity2-1', 'entity3-2'];

  beforeEach(async () => {
    const service = buildService();
    await service.update(ids);
  });

  it('should properly update de denormalizations', async () => {
    const entities = await testingDB.mongodb
      ?.collection('entities')
      .find({ sharedId: { $in: ids } })
      .toArray();

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1-1',
        metadata: {
          relProp1: [
            { value: 'entity1-2', label: 'entity1-2' },
            { value: 'entity2-2', label: 'entity2-2' },
          ],
          relProp2: [
            {
              value: 'entity1-2',
              label: 'entity1-2',
              inheritedValue: [{ value: 'some text' }],
              inheritedType: 'text',
            },
            { value: 'entity2-2', label: 'entity2-2', inheritedValue: [], inheritedType: 'text' },
            { value: 'entity3-2', label: 'entity3-2', inheritedValue: [], inheritedType: 'text' },
          ],
        },
      },
      {
        sharedId: 'entity2-1',
        metadata: {
          relProp1: [{ value: 'entity3-2', label: 'entity3-2' }],
          relProp2: [],
        },
      },
      {
        sharedId: 'entity3-2',
        metadata: {
          relProp3: [{ value: 'entity1-1', label: 'entity1-1' }],
        },
      },
    ]);
  });

  it('should not touch other fields', async () => {
    const entities = await testingDB.mongodb
      ?.collection('entities')
      .find({ sharedId: { $in: ids } })
      .toArray();

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1-1',
        metadata: {
          numeric: [{ value: 1 }],
        },
      },
      {
        sharedId: 'entity2-1',
        metadata: {
          numeric: [{ value: 2 }],
        },
      },
      { sharedId: 'entity3-2' },
    ]);
  });

  it('should make the fields valid again', async () => {
    const entities = await testingDB.mongodb
      ?.collection('entities')
      .find({ sharedId: { $in: ids } })
      .toArray();

    expect(entities).toMatchObject([
      {
        sharedId: 'entity1-1',
        obsoleteMetadata: [],
      },
      {
        sharedId: 'entity2-1',
        obsoleteMetadata: [],
      },
      {
        sharedId: 'entity3-2',
        obsoleteMetadata: [],
      },
    ]);
  });
});
