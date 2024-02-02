import { search } from 'api/search';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';
import entities from '../entities';
import * as v2Support from '../v2_support';
import { inspect } from 'util';

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

const fixtures: DBFixture = {
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
      'entity5',
      'template1',
      {},
      { obsoleteMetadata: ['relProp'] },
      { en: { title: 'entity5-en' }, es: { title: 'entity5-es' } }
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
    factory.template('template1', [
      factory.property('relProp', 'newRelationship', {
        query,
        targetTemplates: [factory.id('template1').toString()],
      }),
    ]),
    factory.template('template2', [
      factory.property('relProp2', 'newRelationship', {
        query,
        targetTemplates: [factory.id('template1').toString()],
      }),
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
      {
        _id: factory.id('entity5-en'),
        sharedId: 'entity5',
        obsoleteMetadata: ['relProp'],
      },
      {
        _id: factory.id('entity5-es'),
        sharedId: 'entity5',
        obsoleteMetadata: ['relProp'],
      },
    ]);
  });
});

describe('entities.save()', () => {
  describe('when creating an entity', () => {
    it('should have no obsolete metadata', async () => {
      const markSpy = jest
        .spyOn(v2Support, 'denormalizeAfterEntityCreation')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .mockImplementation(async (e: any) => Promise.resolve());

      const expected = {
        title: 'new_entity',
        obsoleteMetadata: [],
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

    it('should create relationships accordingly to the metadata', async () => {
      await entities.save(
        {
          template: factory.id('template1'),
          title: 'new_entity2',
          language: 'en',
          metadata: {
            relProp: [{ value: 'entity2' }],
          },
        },
        { user: adminUser, language: 'en' }
      );

      const inDb = await db
        ?.collection('entities')
        .find({ title: 'new_entity2' }, { sort: { language: 1 } })
        .toArray();
      expect(inDb).toMatchObject([
        {
          title: 'new_entity2',
          metadata: { relProp: [{ value: 'entity2', label: 'entity2-en' }] },
          language: 'en',
        },
        {
          title: 'new_entity2',
          metadata: { relProp: [{ value: 'entity2', label: 'entity2-es' }] },
          language: 'es',
        },
      ]);
      const rels = await db
        ?.collection('relationships')
        .find({ 'from.entity': inDb![0].sharedId })
        .toArray();
      expect(rels).toMatchObject([
        {
          from: { entity: inDb![0].sharedId },
          to: { entity: 'entity2' },
          type: factory.id('rtype1'),
        },
      ]);
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

  it('should create and delete the relationships accordingly and update the metadata', async () => {
    const [entity] = await entities.get({ sharedId: 'entity1', language: 'en' });
    const saved = await entities.save(
      {
        ...entity,
        metadata: { relProp: [{ value: 'entity2' }, { value: 'entity5' }] },
      },
      { user: adminUser, language: 'en' }
    );

    const inDb = await db?.collection('relationships').find({}).toArray();

    expect(inDb?.find(rel => rel._id.equals(factory.id('rel1-3')))).toBe(undefined);
    expect(inDb).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: {
            entity: 'entity1',
          },
          to: {
            entity: 'entity5',
          },
        }),
      ])
    );

    expect(saved.metadata).toEqual({
      relProp: [
        { value: 'entity2', label: 'entity2-en' },
        { value: 'entity5', label: 'entity5-en' },
      ],
    });
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
