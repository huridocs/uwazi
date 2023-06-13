import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoRelationshipsDataSource } from 'api/relationships.v2/database/MongoRelationshipsDataSource';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { Db } from 'mongodb';
import { DenormalizationService } from '../DenormalizationService';

const factory = getFixturesFactory();

const entityInLanguages = (langs: string[], id: string, template?: string) =>
  langs.map(lang => factory.entity(id, template, {}, { language: lang }));

const fixtures: DBFixture = {
  relationships: [
    {
      _id: factory.id('rel1'),
      from: { entity: 'entity1' },
      to: { entity: 'hub1' },
      type: factory.id('nullType'),
    },
    {
      _id: factory.id('rel2'),
      to: { entity: 'hub1' },
      from: { entity: 'entity3' },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel3'),
      to: { entity: 'hub1' },
      from: {
        entity: 'entity4',
        file: factory.id('file4'),
        selections: [{ page: 1, top: 1, left: 1, height: 1, width: 1 }],
        text: '',
      },
      type: factory.id('relType1'),
    },
    {
      _id: factory.id('rel4'),
      from: { entity: 'entity1' },
      to: { entity: 'hub2' },
      type: factory.id('nullType'),
    },
    {
      _id: factory.id('rel5'),
      to: { entity: 'hub2' },
      from: { entity: 'entity5' },
      type: factory.id('relType2'),
    },
    {
      _id: factory.id('rel6'),
      to: { entity: 'hub2' },
      from: { entity: 'entity6' },
      type: factory.id('relType3'),
    },
    {
      _id: factory.id('rel7'),
      from: { entity: 'entity2' },
      to: { entity: 'hub3' },
      type: factory.id('relType4'),
    },
    {
      _id: factory.id('rel8'),
      to: { entity: 'hub3' },
      from: { entity: 'entity7' },
      type: factory.id('relType5'),
    },
    {
      _id: factory.id('rel9'),
      from: { entity: 'entity7' },
      to: { entity: 'entity4' },
      type: factory.id('relType5'),
    },
    {
      _id: factory.id('rel10'),
      from: { entity: 'entity9' },
      to: { entity: 'entity4' },
      type: factory.id('relType5'),
    },
  ],
  entities: [
    ...factory.entityInMultipleLanguages(
      ['hu', 'es'],
      'entity1',
      'template1',
      {},
      { obsoleteMetadata: [] },
      {
        hu: {
          metadata: {
            relationshipProp1: [{ value: 'entity4', label: 'entity4-hu' }],
            relationshipProp1_with_inherit: [
              {
                value: 'entity4',
                label: 'entity4-hu',
                inheritedType: 'text',
                inheritedValue: [{ value: 'inherited_value_hu' }],
              },
            ],
          },
        },
        es: {
          metadata: {
            relationshipProp1: [{ value: 'entity4', label: 'entity4-es' }],
            relationshipProp1_with_inherit: [
              {
                value: 'entity4',
                label: 'entity4-es',
                inheritedType: 'text',
                inheritedValue: [{ value: 'inherited_value_es' }],
              },
            ],
          },
        },
      }
    ),
    ...entityInLanguages(['hu', 'es'], 'entity2'),
    ...entityInLanguages(['hu', 'es'], 'hub1', 'formerHubsTemplate'),
    ...entityInLanguages(['hu', 'es'], 'entity3', 'template2'),
    ...factory.entityInMultipleLanguages(
      ['hu', 'es'],
      'entity4',
      'template4',
      {},
      { obsoleteMetadata: [] },
      {
        hu: {
          metadata: {
            to_inherit: [{ value: 'inherited_value_hu' }],
          },
        },
        es: {
          metadata: {
            to_inherit: [{ value: 'inherited_value_es' }],
          },
        },
      }
    ),
    ...entityInLanguages(['hu', 'es'], 'hub2', 'formerHubsTemplate'),
    ...entityInLanguages(['hu', 'es'], 'entity5', 'template2'),
    ...entityInLanguages(['hu', 'es'], 'entity6', 'template3'),
    ...entityInLanguages(['hu', 'es'], 'hub3'),
    ...entityInLanguages(['hu', 'es'], 'entity7', 'template7'),
    ...entityInLanguages(['hu', 'es'], 'entity8'),
    ...entityInLanguages(['hu', 'es'], 'entity9', 'template7'),
    ...entityInLanguages(['hu', 'es'], 'entity10', 'template1'),
  ],
  files: [factory.file('file4', 'entity4', 'document', 'file4.pdf', 'hu')],
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
      {
        name: 'relationshipProp1_with_inherit',
        type: 'newRelationship',
        label: 'relationshipProp1_with_inherit',
        denormalizedProperty: 'to_inherit',
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
        name: 'to_inherit',
        type: 'text',
        label: 'to_inherit',
      },
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
          label: 'Hungarian',
          key: 'hu',
        },
        {
          label: 'Spanish',
          key: 'es',
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
  const templatesDataSource = new MongoTemplatesDataSource(db, transactionManager);
  service = new DenormalizationService(
    relationshipsDataSource,
    new MongoEntitiesDataSource(
      db,
      templatesDataSource,
      relationshipsDataSource,
      new MongoSettingsDataSource(db, transactionManager),
      transactionManager
    ),
    templatesDataSource,
    new MongoSettingsDataSource(db, transactionManager),
    transactionManager,
    async () => {}
  );
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('denormalizeAfterCreatingRelationships()', () => {
  describe('when executing on a newly created relationship', () => {
    it.each(['hu', 'es'])(
      'should mark the relationship fields as invalid in the entities in "%s"',
      async language => {
        await service.denormalizeAfterCreatingRelationships([factory.id('rel3').toHexString()]);
        const entities = await testingDB.mongodb
          ?.collection('entities')
          .find({ language, 'obsoleteMetadata.0': { $exists: true } })
          .toArray();
        expect(entities?.length).toBe(4);
        expect(entities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sharedId: 'entity1',
              obsoleteMetadata: expect.arrayContaining([
                'relationshipProp1',
                'relationshipProp1_with_inherit',
              ]),
            }),
            expect.objectContaining({
              sharedId: 'entity4',
              obsoleteMetadata: ['relationshipProp3'],
            }),
            expect.objectContaining({
              sharedId: 'entity7',
              obsoleteMetadata: ['relationshipProp2'],
            }),
            expect.objectContaining({
              sharedId: 'entity9',
              obsoleteMetadata: ['relationshipProp2'],
            }),
          ])
        );
      }
    );
  });
});

describe('denormalizeBeforeDeletingFiles()', () => {
  describe('when executing before deleting a file', () => {
    it.each(['hu', 'es'])(
      'should mark the relationship fields as invalid in the entities in "%s"',
      async language => {
        await service.denormalizeBeforeDeletingFiles([factory.id('file4').toHexString()]);
        const entities = await testingDB.mongodb
          ?.collection('entities')
          .find({ language, 'obsoleteMetadata.0': { $exists: true } })
          .toArray();
        expect(entities?.length).toBe(4);
        expect(entities).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sharedId: 'entity1',
              obsoleteMetadata: expect.arrayContaining([
                'relationshipProp1',
                'relationshipProp1_with_inherit',
              ]),
            }),
            expect.objectContaining({
              sharedId: 'entity4',
              obsoleteMetadata: ['relationshipProp3'],
            }),
            expect.objectContaining({
              sharedId: 'entity7',
              obsoleteMetadata: ['relationshipProp2'],
            }),
            expect.objectContaining({
              sharedId: 'entity9',
              obsoleteMetadata: ['relationshipProp2'],
            }),
          ])
        );
      }
    );
  });
});

describe('denormalizeAfterUpdatingEntities()', () => {
  describe('when executing on an existing entity', () => {
    it('should update the relationship fields denormalizations in the entity with the new data in the provided language', async () => {
      await testingDB.mongodb?.collection('entities').updateOne(
        { sharedId: 'entity4', language: 'es' },
        {
          $set: {
            title: 'entity4-es-edited',
            'metadata.to_inherit': [{ value: 'inherited_value_es_edited' }],
          },
        }
      );

      await service.denormalizeAfterUpdatingEntities(['entity4'], 'es');

      const entities = await testingDB.mongodb
        ?.collection('entities')
        .find({ sharedId: 'entity1' })
        .toArray();
      expect(entities).toMatchObject([
        {
          sharedId: 'entity1',
          language: 'hu',
          metadata: {
            relationshipProp1: [{ value: 'entity4', label: 'entity4-hu' }],
            relationshipProp1_with_inherit: [
              {
                value: 'entity4',
                label: 'entity4-hu',
                inheritedType: 'text',
                inheritedValue: [{ value: 'inherited_value_hu' }],
              },
            ],
          },
          obsoleteMetadata: [],
        },
        {
          sharedId: 'entity1',
          language: 'es',
          metadata: {
            relationshipProp1: [{ value: 'entity4', label: 'entity4-es-edited' }],
            relationshipProp1_with_inherit: [
              {
                value: 'entity4',
                label: 'entity4-es-edited',
                inheritedType: 'text',
                inheritedValue: [{ value: 'inherited_value_es_edited' }],
              },
            ],
          },
          obsoleteMetadata: [],
        },
      ]);
    });
  });
});
