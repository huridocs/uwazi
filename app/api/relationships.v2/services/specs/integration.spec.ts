import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { CreateRelationshipService } from '../service_factories';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'hu'], 'entity1', 'template1'),
    ...factory.entityInMultipleLanguages(['en', 'hu'], 'entity2', 'template2'),
    ...factory.entityInMultipleLanguages(
      ['en', 'hu'],
      'entity3',
      'template3',
      {},
      {},
      {
        en: {
          title: 'entity3-en',
        },
        hu: {
          title: 'entity3-hu',
        },
      }
    ),
  ],
  templates: [
    factory.template('template1', [
      factory.property('relProp1', 'newRelationship', {
        query: [
          {
            direction: 'out',
            types: [factory.id('relType1')],
            match: [
              {
                templates: [factory.id('template2')],
                traverse: [
                  {
                    direction: 'out',
                    types: [factory.id('relType1')],
                    match: [
                      {
                        templates: [factory.id('template3')],
                        traverse: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ]),
  ],
  relationships: [
    {
      _id: factory.id('rel1'),
      from: {
        entity: 'entity1',
      },
      to: {
        entity: 'entity2',
      },
      type: factory.id('relType1'),
    },
  ],
  relationtypes: [
    {
      _id: factory.id('relType1'),
      name: 'relType1',
    },
  ],
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
        },
        {
          default: true,
          label: 'Hungarian',
          key: 'hu',
        },
      ],
      features: {
        newRelationships: true,
      },
    },
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('create relationships', () => {
  it('should transactionally create relationships and denormalize the related entities', async () => {
    const createRelationshipService = await CreateRelationshipService();
    await createRelationshipService.create([
      {
        from: {
          type: 'entity',
          entity: 'entity2',
        },
        to: {
          type: 'entity',
          entity: 'entity3',
        },
        type: factory.id('relType1').toString(),
      },
    ]);

    const entity1 = await testingDB.mongodb
      ?.collection('entities')
      .find({ sharedId: 'entity1' })
      .toArray();

    expect(entity1).toEqual([
      expect.objectContaining({
        language: 'en',
        metadata: expect.objectContaining({
          relProp1: [{ value: 'entity3', label: 'entity3-en' }],
        }),
      }),
      expect.objectContaining({
        language: 'hu',
        metadata: expect.objectContaining({
          relProp1: [{ value: 'entity3', label: 'entity3-hu' }],
        }),
      }),
    ]);
  });
});
