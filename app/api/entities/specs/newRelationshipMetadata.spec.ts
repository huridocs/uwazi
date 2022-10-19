import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';
import entities from '../entities';

const factory = getFixturesFactory();

let db = testingDB.mongodb;

const query = [
  {
    direction: 'out',
    types: [factory.id('rtype1')],
    match: [
      {
        templates: [factory.id('template1')],
      },
    ],
  },
];

const adminUser = factory.user('admin', UserRole.ADMIN);

const fixtures = {
  users: [adminUser],
  entities: [
    factory.entity('entity1', 'template1', {}, { obsoleteMetadata: ['relProp'] }),
    factory.entity('entity2', 'template1', {}, { obsoleteMetadata: ['relProp'] }),
    factory.entity('entity3', 'template1', {}, { obsoleteMetadata: ['relProp'] }),
    factory.entity(
      'entity4',
      'template2',
      { relProp2: [{ value: 'existing_value' }] },
      { obsoleteMetadata: [] }
    ),
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
    factory.template('template1', [factory.property('relProp', 'newRelationship', { query })]),
    factory.template('template2', [factory.property('relProp2', 'newRelationship', { query })]),
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
  db = testingDB.mongodb;
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('entities.get()', () => {
  it('should denormalize newRelationship metadata', async () => {
    const allEntities = await entities.get({ template: factory.id('template1') });
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

  it('should persist changes in the database', async () => {
    let allEntities = await entities.get({ template: factory.id('template1') });
    allEntities = await db
      ?.collection('entities')
      .find({ template: factory.id('template1') })
      .toArray();
    expect(allEntities).toMatchObject([
      {
        sharedId: 'entity1',
        metadata: {
          relProp: [
            { value: 'entity2', label: 'entity2' },
            { value: 'entity3', label: 'entity3' },
          ],
        },
        obsoleteMetadata: [],
      },
      {
        sharedId: 'entity2',
        metadata: {
          relProp: [{ value: 'entity1', label: 'entity1' }],
        },
        obsoleteMetadata: [],
      },
      {
        sharedId: 'entity3',
        metadata: {},
        obsoleteMetadata: [],
      },
    ]);
  });

  it('should only read when not obsolete', async () => {
    const allEntities = await entities.get({ template: factory.id('template2') });
    expect(allEntities).toMatchObject([
      {
        sharedId: 'entity4',
        metadata: {
          relProp2: [{ value: 'existing_value' }],
        },
        obsoleteMetadata: [],
      },
    ]);
  });
});

describe('entities.save()', () => {
  it('should mark newRelationship metadata as obsolete when creating new entity', async () => {
    const performSpy = jest
      .spyOn(entities, 'performNewRelationshipQueries')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation(async (e: any, rds: any) => Promise.resolve());
    const markSpy = jest
      .spyOn(entities, 'markNewRelationshipsOfAffected')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation(async (e: any, i: any) => Promise.resolve());

    const expected = {
      title: 'new_entity',
      obsoleteMetadata: ['relProp'],
    };
    const saved = await entities.save(
      {
        template: factory.id('template1'),
        title: 'new_entity',
      },
      { user: adminUser, language: 'en' }
    );
    expect(saved).toMatchObject(expected);
    const inDb = await db?.collection('entities').findOne({ title: 'new_entity' });
    expect(inDb).toMatchObject(expected);

    performSpy.mockRestore();
    markSpy.mockRestore();
  });

  it('should mark newRelationship metadata of related entities as obsolete', async () => {
    await db
      ?.collection('entities')
      .updateOne({ sharedId: 'entity1' }, { $set: { obsoleteMetadata: [] } });

    const spy = jest
      .spyOn(entities, 'performNewRelationshipQueries')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation(async (e: any, rds: any) => Promise.resolve());

    await entities.save(
      {
        _id: factory.id('entity2'),
        sharedId: 'entity2',
        template: factory.id('template1'),
        title: 'entity2-renamed',
      },
      { user: adminUser, language: 'en' }
    );
    const inDb = await db?.collection('entities').findOne({ sharedId: 'entity1' });
    expect(inDb).toMatchObject({
      sharedId: 'entity1',
      obsoleteMetadata: ['relProp'],
    });

    spy.mockRestore();
  });
});

describe('entities.delete()', () => {
  it('should delete related new relationships', async () => {
    await entities.delete('entity2', false);
    const inDb = await db?.collection('relationships').find({}).toArray();
    expect(inDb).toMatchObject([
      {
        from: 'entity1',
        to: 'entity3',
      },
    ]);
  });
});
