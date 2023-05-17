import { search } from 'api/search';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';
import entities from '../entities';
import * as v2Support from '../v2_support';

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

const languages = ['en', 'es'];

const fixtures = {
  users: [adminUser],
  entities: [
    ...factory.entityInMultipleLanguages(
      languages,
      'entity1',
      'template1',
      {},
      { obsoleteMetadata: ['relProp'] },
      {
        en: {
          title: 'entity1-en',
          metadata: {
            relProp: [
              { value: 'entity2', label: 'entity2-en' },
              { value: 'entity3', label: 'entity3-en' },
            ],
          },
        },
        es: {
          title: 'entity1-es',
          metadata: {
            relProp: [
              { value: 'entity2', label: 'entity2-es' },
              { value: 'entity3', label: 'entity3-es' },
            ],
          },
        },
      }
    ),
    ...factory.entityInMultipleLanguages(
      languages,
      'entity2',
      'template1',
      {},
      { obsoleteMetadata: ['relProp'] },
      { en: { title: 'entity2-en' }, es: { title: 'entity2-es' } }
    ),
    ...factory.entityInMultipleLanguages(
      languages,
      'entity3',
      'template1',
      {},
      { obsoleteMetadata: ['relProp'] },
      { en: { title: 'entity3-en' }, es: { title: 'entity3-es' } }
    ),
    ...factory.entityInMultipleLanguages(
      languages,
      'entity4',
      'template2',
      { relProp2: [{ value: 'existing_value' }] },
      { obsoleteMetadata: ['relProp'] },
      { en: { title: 'entity4-en' }, es: { title: 'entity4-es' } }
    ),
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
    {
      _id: factory.id('rel2-1'),
      from: { entity: 'entity2' },
      to: { entity: 'entity1' },
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
        {
          label: 'Spanish',
          key: 'es',
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
  it('should include the obsoleteMetadata field', async () => {
    const allEntities = await entities.get({ template: factory.id('template1') });
    expect(allEntities).toMatchObject([
      {
        _id: factory.id('entity1-en'),
        sharedId: 'entity1',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity1-es'),
        sharedId: 'entity1',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity2-en'),
        sharedId: 'entity2',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity2-es'),
        sharedId: 'entity2',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity3-en'),
        sharedId: 'entity3',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity3-es'),
        sharedId: 'entity3',
        obsoleteMetadata: ['relProp'],
      },
    ]);
  });
});

describe('entities.save()', () => {
  describe('when creating an entity', () => {
    it('should mark newRelationship metadata as obsolete on the created entity', async () => {
      const markSpy = jest
        .spyOn(v2Support, 'denormalizeAfterEntityCreation')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .mockImplementation(async (e: any) => Promise.resolve());

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
      const inDb = await db?.collection('entities').find({ title: 'new_entity' }).toArray();
      expect(inDb).toMatchObject([expected, expected]);

      markSpy.mockRestore();
    });
  });

  describe('when updating an entity', () => {
    it('should update the denormalized title in the related entities', async () => {
      jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
      await entities.save(
        {
          _id: factory.id('entity2-en'),
          sharedId: 'entity2',
          language: 'en',
          template: factory.id('template1'),
          title: 'entity2-en-renamed',
        },
        { user: adminUser, language: 'en' }
      );
      const inDb = await db?.collection('entities').find({ sharedId: 'entity1' }).toArray();

      expect(inDb).toMatchObject([
        {
          sharedId: 'entity1',
          language: 'en',
          metadata: {
            relProp: [
              { value: 'entity2', label: 'entity2-en-renamed' },
              { value: 'entity3', label: 'entity3-en' },
            ],
          },
        },
        {
          sharedId: 'entity1',
          language: 'es',
          metadata: {
            relProp: [
              { value: 'entity2', label: 'entity2-es' },
              { value: 'entity3', label: 'entity3-es' },
            ],
          },
        },
      ]);
      expect(search.indexEntities).toHaveBeenCalledWith({
        sharedId: { $in: ['entity1', 'entity1'] },
      });
    });
  });

  it('should not overwrite newRelationship metadata', async () => {
    const [entity] = await entities.get({ sharedId: 'entity4', language: 'en' });
    const saved = await entities.save(
      {
        ...entity,
        metadata: { relProp2: [{ value: 'overwriten_value' }] },
      },
      { user: adminUser, language: 'en' }
    );
    expect(saved.metadata).toEqual({ relProp2: [{ value: 'existing_value' }] });
  });
});

describe('entities.delete()', () => {
  it('should delete related new relationships', async () => {
    await entities.delete('entity2', false);
    const inDb = await db?.collection('relationships').find({}).toArray();
    expect(inDb).toMatchObject([
      {
        from: { entity: 'entity1' },
        to: { entity: 'entity3' },
      },
    ]);
  });
});
