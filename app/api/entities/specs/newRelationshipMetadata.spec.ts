import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import entities from '../entities';

const factory = getFixturesFactory();

let db = testingDB.mongodb;

const fixtures = {
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2', 'template1'),
    factory.entity('entity3', 'template1'),
  ],
  relationships: [
    {
      _id: factory.id('rel1-2'),
      from: 'entity1',
      to: 'entity2',
      type: factory.id('rtype1'),
    },
    {
      _id: factory.id('rel1-3'),
      from: 'entity1',
      to: 'entity3',
      type: factory.id('rtype1'),
    },
    {
      _id: factory.id('rel2-1'),
      from: 'entity2',
      to: 'entity1',
      type: factory.id('rtype1'),
    },
  ],
  relationtypes: [
    {
      _id: factory.id('rtype1'),
      name: 'rtype1',
    },
  ],
  templates: [
    factory.template('template1', [
      factory.property('relProp', 'newRelationship', {
        query: {
          traverse: [
            {
              direction: 'out',
              types: [factory.id('rtype1').toHexString()],
              match: [
                {
                  templates: [factory.id('template1').toHexString()],
                },
              ],
            },
          ],
        },
      }),
    ]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
  db = testingDB.mongodb;
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('entities.get()', () => {
  it('should denormalize newRelationship metadata', async () => {
    const allEntities = await entities.get({});
    expect(allEntities).toMatchObject([
      {
        sharedId: 'entity1',
        metadata: {
          relProp: [
            { value: 'entity2', label: 'entity2' },
            { value: 'entity3', label: 'entity3' },
          ],
        },
      },
      {
        sharedId: 'entity2',
        metadata: {
          relProp: [{ value: 'entity1', label: 'entity1' }],
        },
      },
      {
        sharedId: 'entity3',
        metadata: {},
      },
    ]);
  });
});
