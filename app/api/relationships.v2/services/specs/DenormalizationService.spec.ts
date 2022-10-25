import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { Db } from 'mongodb';
import { DenormalizationService } from '../DenormalizationService';

const factory = getFixturesFactory();

const fixtures = {
  relationships: [
    { _id: factory.id('rel1'), from: 'entity1', to: 'hub1', type: factory.id('nullType') },
    { _id: factory.id('rel2'), to: 'hub1', from: 'entity3', type: factory.id('relType1') },
    { _id: factory.id('rel3'), to: 'hub1', from: 'entity4', type: factory.id('relType1') },
    { _id: factory.id('rel4'), from: 'entity1', to: 'hub2', type: factory.id('nullType') },
    { _id: factory.id('rel5'), to: 'hub2', from: 'entity5', type: factory.id('relType2') },
    { _id: factory.id('rel6'), to: 'hub2', from: 'entity6', type: factory.id('relType3') },
    { _id: factory.id('rel7'), from: 'entity2', to: 'hub3', type: factory.id('relType4') },
    { _id: factory.id('rel8'), to: 'hub3', from: 'entity7', type: factory.id('relType5') },
    { _id: factory.id('rel9'), from: 'entity7', to: 'entity4', type: factory.id('relType5') },
  ],
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2'),
    factory.entity('hub1', 'formerHubsTemplate'),
    factory.entity('entity3', 'template2'),
    factory.entity('entity4', 'template4'),
    factory.entity('hub2', 'formerHubsTemplate'),
    factory.entity('entity5', 'template2'),
    factory.entity('entity6', 'template3'),
    factory.entity('hub3'),
    factory.entity('entity7', 'template7'),
    factory.entity('entity8'),
  ],
  templates: [
    factory.template('template1', [
      {
        name: 'relationshipProp1',
        type: 'newRelationship',
        label: 'relationshipProp1',
        query: [
          {
            types: [factory.id('nullType')],
            direction: 'out',
            match: [
              {
                templates: [factory.id('formerHubsTemplate')],
                traverse: [
                  {
                    types: [factory.id('relType1')],
                    direction: 'in',
                    match: [
                      {
                        templates: [factory.id('template4')],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]),
    factory.template('template7', [
      {
        name: 'relationshipProp2',
        type: 'newRelationship',
        label: 'relationshipProp2',
        query: [
          {
            types: [factory.id('relType5')],
            direction: 'out',
            match: [
              {
                templates: [factory.id('template4')],
                traverse: [
                  {
                    types: [factory.id('relType1')],
                    direction: 'out',
                    match: [
                      {
                        templates: [factory.id('formerHubsTemplate')],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]),
    factory.template('template4', [
      {
        name: 'relationshipProp3',
        type: 'newRelationship',
        label: 'relationshipProp3',
        query: [
          {
            types: [factory.id('relType1')],
            direction: 'out',
            match: [
              {
                templates: [factory.id('formerHubsTemplate')],
                traverse: [
                  {
                    types: [factory.id('nullType')],
                    direction: 'in',
                    match: [
                      {
                        templates: [factory.id('template1')],
                        traverse: [
                          {
                            types: [factory.id('nullType')],
                            direction: 'in',
                            match: [
                              {
                                templates: [factory.id('formerHubsTemplate')],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]),
  ],
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
        },
      ],
    },
  ],
};

let db: Db;
let service: DenormalizationService;

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);

  db = getConnection();
  const transactionManager = new MongoTransactionManager(getClient());
  const relationshipsDataSource = new MongoRelationshipsDataSource(db, transactionManager);
  service = new DenormalizationService(
    relationshipsDataSource,
    new MongoEntitiesDataSource(
      db,
      relationshipsDataSource,
      new MongoSettingsDataSource(db, transactionManager),
      transactionManager
    ),
    new MongoTemplatesDataSource(db, transactionManager),
    transactionManager,
    async () => {}
  );
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('getCandidateEntitiesForRelationship()', () => {
  it('should return the entities that may need denormalization', async () => {
    const result = await service.getCandidateEntitiesForRelationship(
      factory.id('rel3').toHexString(),
      'en'
    );

    expect(result.length).toBe(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sharedId: 'entity4',
          propertiesToBeMarked: ['relationshipProp3'],
        }),
        expect.objectContaining({
          sharedId: 'entity1',
          propertiesToBeMarked: ['relationshipProp1'],
        }),
        expect.objectContaining({
          sharedId: 'entity7',
          propertiesToBeMarked: ['relationshipProp2'],
        }),
      ])
    );
  });
});
