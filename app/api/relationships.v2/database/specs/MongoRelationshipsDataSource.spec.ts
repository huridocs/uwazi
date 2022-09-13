import { RelationshipsQuery } from 'api/relationships.v2/services/RelationshipsQuery';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { RelationshipsDataSource } from '../RelationshipsDataSource';

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
  ],
  entities: [
    factory.entity('entity1', 'template1'),
    factory.entity('entity2'),
    factory.entity('hub1', 'formerHubsTemplate'),
    factory.entity('entity3', 'template2'),
    factory.entity('entity4', 'template2'),
    factory.entity('hub2', 'formerHubsTemplate'),
    factory.entity('entity5', 'template2'),
    factory.entity('entity6', 'template3'),
    factory.entity('hub3'),
    factory.entity('entity7'),
    factory.entity('entity8'),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('When getting by query', () => {
  it('should allow traversing 1 hop', async () => {
    const ds = new RelationshipsDataSource(testingDB.mongodb!);
    const query: RelationshipsQuery = {
      sharedId: 'entity1',
      traverse: [
        {
          direction: 'out',
          match: [{}],
        },
      ],
    };

    const result = await ds.getByQuery(query).all();
    expect(result).toEqual([
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel1'), type: factory.id('nullType') },
        { _id: factory.id('hub1-en'), sharedId: 'hub1' },
      ],
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel4'), type: factory.id('nullType') },
        { _id: factory.id('hub2-en'), sharedId: 'hub2' },
      ],
    ]);
  });

  it('should allow traversing 2 hops', async () => {
    const ds = new RelationshipsDataSource(testingDB.mongodb!);
    const query: RelationshipsQuery = {
      sharedId: 'entity1',
      traverse: [
        {
          direction: 'out',
          match: [
            {
              traverse: [
                {
                  direction: 'in',
                  match: [{}],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await ds.getByQuery(query).all();
    expect(result).toEqual([
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel1'), type: factory.id('nullType') },
        { _id: factory.id('hub1-en'), sharedId: 'hub1' },
        { _id: factory.id('rel2'), type: factory.id('relType1') },
        { _id: factory.id('entity3-en'), sharedId: 'entity3' },
      ],
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel1'), type: factory.id('nullType') },
        { _id: factory.id('hub1-en'), sharedId: 'hub1' },
        { _id: factory.id('rel3'), type: factory.id('relType1') },
        { _id: factory.id('entity4-en'), sharedId: 'entity4' },
      ],
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel4'), type: factory.id('nullType') },
        { _id: factory.id('hub2-en'), sharedId: 'hub2' },
        { _id: factory.id('rel5'), type: factory.id('relType2') },
        { _id: factory.id('entity5-en'), sharedId: 'entity5' },
      ],
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel4'), type: factory.id('nullType') },
        { _id: factory.id('hub2-en'), sharedId: 'hub2' },
        { _id: factory.id('rel6'), type: factory.id('relType3') },
        { _id: factory.id('entity6-en'), sharedId: 'entity6' },
      ],
    ]);
  });

  it('should be paginable', async () => {
    const ds = new RelationshipsDataSource(testingDB.mongodb!);
    const query: RelationshipsQuery = {
      sharedId: 'entity1',
      traverse: [
        {
          direction: 'out',
          match: [
            {
              traverse: [
                {
                  direction: 'in',
                  match: [{}],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = await ds.getByQuery(query).page(2, 2);
    expect(result.total).toBe(4);
    expect(result.data).toEqual([
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel4'), type: factory.id('nullType') },
        { _id: factory.id('hub2-en'), sharedId: 'hub2' },
        { _id: factory.id('rel5'), type: factory.id('relType2') },
        { _id: factory.id('entity5-en'), sharedId: 'entity5' },
      ],
      [
        { _id: factory.id('entity1-en'), sharedId: 'entity1' },
        { _id: factory.id('rel4'), type: factory.id('nullType') },
        { _id: factory.id('hub2-en'), sharedId: 'hub2' },
        { _id: factory.id('rel6'), type: factory.id('relType3') },
        { _id: factory.id('entity6-en'), sharedId: 'entity6' },
      ],
    ]);
  });
});
