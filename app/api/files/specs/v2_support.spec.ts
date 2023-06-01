import { search } from 'api/search';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { files } from '../files';

const factory = getFixturesFactory();

const fixtures = {
  entities: [
    factory.entity('entity1', 'template1', {
      relProp: [
        {
          value: 'entity2',
          label: 'entity2',
          inheritedValue: [{ value: 'entity2' }],
          inheritedType: 'text',
        },
        {
          value: 'entity3',

          label: 'entity3',
          inheritedValue: [{ value: 'entity3' }],
          inheritedType: 'text',
        },
      ],
    }),
    factory.entity('entity2', 'template1', {
      relProp: [{ value: 'entity3', label: 'entity3' }],
    }),
    factory.entity('entity3', 'template1'),
  ],
  templates: [
    factory.template('template1', [
      {
        name: 'relProp',
        label: 'relProp',
        type: 'newRelationship',
        query: [
          {
            direction: 'out',
            types: [factory.id('type1')],
            match: [
              {
                filter: { type: 'template', value: [factory.id('template1')] },
              },
            ],
          },
        ],
      },
    ]),
  ],
  files: [
    factory.file('file1', 'entity1', 'document', 'file1.pdf'),
    factory.file('file2', 'entity2', 'document', 'file2.pdf'),
    factory.file('file3', 'entity3', 'document', 'file3.pdf'),
  ],
  relationships: [
    {
      _id: factory.id('rel1'),
      from: {
        entity: 'entity1',
        file: factory.id('file1'),
        selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
        text: '',
      },
      to: { entity: 'entity2' },
      type: factory.id('type1'),
    },
    {
      _id: factory.id('rel2'),
      from: { entity: 'entity2' },
      to: {
        entity: 'entity3',
        file: factory.id('file3'),
        selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
        text: '',
      },
      type: factory.id('type1'),
    },
    {
      _id: factory.id('rel3'),
      from: {
        entity: 'entity1',
        file: factory.id('file1'),
        selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
        text: '',
      },
      to: {
        entity: 'entity3',
        file: factory.id('file3'),
        selections: [{ page: 1, top: 1, left: 1, width: 1, height: 1 }],
        text: '',
      },
      type: factory.id('type1'),
    },
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

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when the feature flag is not enabled', () => {
  it('should not execute', async () => {
    await testingDB.mongodb
      ?.collection('settings')
      .updateOne({}, { $set: { features: { newRelationships: false } } });
    await files.delete({ _id: factory.id('file1') });

    const relationships = await testingDB.mongodb?.collection('relationships').find({}).toArray();
    expect(relationships).toEqual(fixtures.relationships);
  });
});

describe('when deleting a file', () => {
  beforeEach(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await files.delete({ _id: factory.id('file1') });
  });

  it('should delete the text references from and to the file', async () => {
    const relationships = await testingDB.mongodb?.collection('relationships').find({}).toArray();
    expect(relationships).toEqual([fixtures.relationships[1]]);
  });

  it('should re-denormalize the affected entities', async () => {
    const entities = await testingDB.mongodb?.collection('entities').find({}).toArray();
    expect(entities).toEqual([
      { ...fixtures.entities[0], obsoleteMetadata: ['relProp'] },
      { ...fixtures.entities[1], obsoleteMetadata: [] },
      { ...fixtures.entities[2], obsoleteMetadata: [] },
    ]);
  });

  it('should reindex the affected entities', () => {
    expect(search.indexEntities).toHaveBeenLastCalledWith(
      {
        sharedId: { $in: ['entity1'] },
      },
      '+fullText'
    );
  });
});
