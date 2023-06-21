import relationtypes from 'api/relationtypes/relationtypes';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

const factory = getFixturesFactory();

const queryInDb = [
  {
    direction: 'out',
    types: [factory.id('rtype_used_in_query')],
    match: [
      {
        templates: [factory.id('template1')],
        traverse: [],
      },
    ],
  },
];

const fixtures: DBFixture = {
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2', 'template1'),
    factory.entity('entity3', 'template1'),
  ],
  relationships: [
    {
      _id: factory.id('rel1-2'),
      from: { entity: 'entity1' },
      to: { entity: 'entity2' },
      type: factory.id('rtype1'),
    },
    {
      _id: factory.id('rel1-3'),
      from: { entity: 'entity1' },
      to: { entity: 'entity3' },
      type: factory.id('rtype1'),
    },
  ],
  relationtypes: [
    {
      _id: factory.id('rtype1'),
      name: 'rtype1',
    },
    {
      _id: factory.id('rtype2'),
      name: 'rtype2',
    },
    {
      _id: factory.id('rtype_used_in_query'),
      name: 'rtype_used_in_query',
    },
  ],
  templates: [
    factory.template('template1'),
    factory.template('template_with_query', [
      factory.property('query', 'newRelationship', { query: queryInDb }),
    ]),
  ],
  settings: [
    {
      languages: [
        {
          default: true,
          label: 'English',
          key: 'en',
          localized_label: 'English',
        },
      ],
      features: {
        newRelationships: true,
      },
    },
  ],
};

let db = testingDB.mongodb;

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  db = testingDB.mongodb;
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('relationtypes.delete()', () => {
  it('should not delete type when there are related new relationships', async () => {
    const answer = await relationtypes.delete(factory.id('rtype1'));
    const inDb = await db?.collection('relationtypes').find({}).toArray();
    expect(answer).toBe(false);
    expect(inDb).toMatchObject([
      {
        name: 'rtype1',
      },
      {
        name: 'rtype2',
      },
      {
        name: 'rtype_used_in_query',
      },
    ]);
  });

  it('should delete type when there are no related new relationships', async () => {
    const answer = await relationtypes.delete(factory.id('rtype2'));
    const inDb = await db?.collection('relationtypes').find({}).toArray();
    expect(answer).toBe(true);
    expect(inDb).toMatchObject([
      {
        name: 'rtype1',
      },
      {
        name: 'rtype_used_in_query',
      },
    ]);
  });

  it('should not delete type when it is used in a query', async () => {
    const answer = await relationtypes.delete(factory.id('rtype_used_in_query'));
    const inDb = await db?.collection('relationtypes').find({}).toArray();
    expect(answer).toBe(false);
    expect(inDb).toMatchObject([
      {
        name: 'rtype1',
      },
      {
        name: 'rtype2',
      },
      {
        name: 'rtype_used_in_query',
      },
    ]);
  });
});
