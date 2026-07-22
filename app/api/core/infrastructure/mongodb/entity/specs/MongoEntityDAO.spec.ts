import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoEntitiesDAO } from '../MongoEntitiesDAO.js';

const factory = getFixturesFactory();

const adminUser = new User(factory.id('admin_user').toString(), 'admin', []);
const editorUser = new User(factory.id('editor_user').toString(), 'editor', []);
const collaboratorUser = new User(factory.id('collab_user').toString(), 'collaborator', [
  factory.id('collab_group').toString(),
]);
const otherCollaborator = new User(factory.id('other_collab').toString(), 'collaborator', []);
const publicUser = User.createFrom(null);

const pastDate = new Date('2020-01-01T00:00:00Z');
const cutoffDate = new Date('2025-06-01T00:00:00Z');
const recentDate = new Date('2025-06-02T00:00:00Z');

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],

  templates: [factory.template('template_1', [])],

  entities: [
    // entity_1: published, with user permission for collab_user
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity_1',
      'template_1',
      {},
      {
        published: true,
        permissions: [
          { refId: collaboratorUser._id, type: 'user' as const, level: 'write' as const },
        ],
      }
    ),

    // entity_2: unpublished, no permissions (only admin/editor can see)
    factory.entity('entity_2', 'template_1', {}, { language: 'en' }),

    // entity_3: unpublished, with user permission for collab_user
    factory.entity(
      'entity_3',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [
          { refId: collaboratorUser._id, type: 'user' as const, level: 'read' as const },
        ],
      }
    ),

    // entity_4: unpublished, with group permission for collab_group
    factory.entity(
      'entity_4',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [
          {
            refId: collaboratorUser.groups[0],
            type: 'group' as const,
            level: 'read' as const,
          },
        ],
      }
    ),

    // entity_5: published, no permissions
    factory.entity(
      'entity_5',
      'template_1',
      {},
      {
        language: 'en',
        published: true,
      }
    ),
  ],

  files: [
    // Documents for entity_1
    factory.document('doc1.pdf', {
      entity: 'entity_1',
      originalname: 'document1.pdf',
      language: 'en',
      status: 'ready',
    }),
    factory.document('doc2.pdf', {
      entity: 'entity_1',
      originalname: 'document2.pdf',
      language: 'en',
      status: 'processing',
    }),
    // Attachments for entity_1
    factory.attachment('att1.jpg', {
      entity: 'entity_1',
      originalname: 'attachment1.jpg',
    }),
    factory.attachment('att2.png', {
      entity: 'entity_1',
      originalname: 'attachment2.png',
    }),
    factory.attachment('att3.txt', {
      entity: 'entity_1',
      originalname: 'attachment3.txt',
    }),
    // Files for entity_2 (only documents)
    factory.document('doc3.pdf', {
      entity: 'entity_2',
      originalname: 'document3.pdf',
      language: 'en',
      status: 'ready',
    }),
  ],
};

const createSut = (user: User = adminUser) =>
  new MongoEntitiesDAO(getConnection(), TransactionManagerFactory.default(), user);

describe('MongoEntitiesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });
  describe('getWithFiles()', () => {
    // eslint-disable-next-line max-statements
    it('should return entity with files separated as documents and attachments', async () => {
      const dao = createSut();
      const entities = await dao.getWithFiles({ sharedId: 'entity_1', language: 'en' });
      const entity = entities[0];

      expect(entities).toHaveLength(1);
      expect(entity.sharedId).toBe('entity_1');
      expect((entity as any)?.files).toBe(undefined);
      expect(entity.documents).toHaveLength(2);
      expect(entity.attachments).toHaveLength(3);
      expect(entity.documents.every(d => d.type === 'document')).toBe(true);
      expect(entity.attachments.every(a => a.type === 'attachment')).toBe(true);
    });

    it('should return empty array when no entities match', async () => {
      const dao = createSut();
      const entities = await dao.getWithFiles({ sharedId: 'non_existent', language: 'en' });

      expect(entities).toHaveLength(0);
    });
  });

  describe('permission filtering', () => {
    it('should return all entities for admin users', async () => {
      const dao = createSut(adminUser);
      const entities = await dao.getWithFiles({ language: 'en' });
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return all entities for editor users', async () => {
      const dao = createSut(editorUser);
      const entities = await dao.getWithFiles({ language: 'en' });
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return only published entities for public users', async () => {
      const dao = createSut(publicUser);
      const entities = await dao.getWithFiles({ language: 'en' });
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_5']);
    });

    it('should return published + explicitly shared entities for collaborator', async () => {
      const dao = createSut(collaboratorUser);
      const entities = await dao.getWithFiles({ language: 'en' });
      const sharedIds = entities.map(e => e.sharedId).sort();

      // entity_1: published + has user permission
      // entity_3: unpublished, has user permission for collab_user
      // entity_4: unpublished, has group permission for collab_group
      // entity_5: published, no permissions
      expect(sharedIds).toEqual(['entity_1', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return only published entities for collaborator without matching permissions', async () => {
      const dao = createSut(otherCollaborator);
      const entities = await dao.getWithFiles({ language: 'en' });
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_5']);
    });

    it('should not return an unpublished entity to public user even when queried by sharedId', async () => {
      const dao = createSut(publicUser);
      const entities = await dao.getWithFiles({ sharedId: 'entity_2', language: 'en' });

      expect(entities).toHaveLength(0);
    });

    it('should return unpublished entity shared with collaborator via group permission', async () => {
      const dao = createSut(collaboratorUser);
      const entities = await dao.getWithFiles({ sharedId: 'entity_4', language: 'en' });

      expect(entities).toHaveLength(1);
      expect(entities[0].sharedId).toBe('entity_4');
    });
  });

  describe('streamAll()', () => {
    it('returns all entity documents regardless of permissions or published status', async () => {
      const dao = new MongoEntitiesDAO(
        getConnection(),
        TransactionManagerFactory.default(),
        User.createFrom(null)
      );
      const entities = await dao.streamAll().toArray();
      const sharedIds = [...new Set(entities.map(e => e.sharedId))].sort();
      expect(sharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('returns results sorted by sharedId so language variants are contiguous', async () => {
      const dao = new MongoEntitiesDAO(
        getConnection(),
        TransactionManagerFactory.default(),
        User.createFrom(null)
      );
      const entities = await dao.streamAll().toArray();
      const returnedSharedIds = entities.map(e => e.sharedId);
      expect(returnedSharedIds).toEqual([...returnedSharedIds].sort());
    });

    it('with afterSharedId returns only entities whose sharedId is lexically after the checkpoint', async () => {
      const dao = new MongoEntitiesDAO(
        getConnection(),
        TransactionManagerFactory.default(),
        User.createFrom(null)
      );
      const entities = await dao.streamAll({ afterSharedId: 'entity_3' }).toArray();
      const sharedIds = [...new Set(entities.map(e => e.sharedId))].sort();
      expect(sharedIds).toEqual(['entity_4', 'entity_5']);
    });

    it('with afterSharedId returns empty cursor when no entities follow the checkpoint', async () => {
      const dao = new MongoEntitiesDAO(
        getConnection(),
        TransactionManagerFactory.default(),
        User.createFrom(null)
      );
      const entities = await dao.streamAll({ afterSharedId: 'entity_5' }).toArray();
      expect(entities).toHaveLength(0);
    });

    describe('when collection is empty', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp({ entities: [] });
      });

      it('returns an empty cursor', async () => {
        const dao = new MongoEntitiesDAO(
          getConnection(),
          TransactionManagerFactory.default(),
          User.createFrom(null)
        );
        const result = await dao.streamAll().toArray();
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('cloneForLanguage()', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    it('should clone all entities from the source language to the target language', async () => {
      const dao = createSut();
      await dao.cloneForLanguage('en', 'fr');

      const cloned = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'fr' })
        .toArray();

      const originalSharedIds = ['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5'].sort();
      expect(cloned.map(e => e.sharedId).sort()).toEqual(originalSharedIds);
      expect(cloned.every(e => e.language === 'fr')).toBe(true);
    });

    it('should be idempotent (running twice does not create duplicates)', async () => {
      const dao = createSut();
      await dao.cloneForLanguage('en', 'fr');
      await dao.cloneForLanguage('en', 'fr');

      const cloned = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'fr' })
        .toArray();

      expect(cloned).toHaveLength(5);
    });

    it('should not overwrite already existing entities for the target language', async () => {
      const dao = createSut();
      await dao.cloneForLanguage('en', 'es');

      const esEntities = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'es' })
        .toArray();

      // entity_1 already existed in 'es' from fixtures; it should not be overwritten
      const entity1es = esEntities.find(e => e.sharedId === 'entity_1');
      expect(entity1es).toBeDefined();
      // The other en-only entities should have been cloned
      const clonedSharedIds = esEntities.map(e => e.sharedId).sort();
      expect(clonedSharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should call onBatch with all cloned entities having the target language', async () => {
      const dao = createSut();
      const onBatch = jest.fn().mockResolvedValue(undefined);
      await dao.cloneForLanguage('en', 'fr', onBatch);

      expect(onBatch).toHaveBeenCalled();
      const allReceived = onBatch.mock.calls.flatMap((args: any[]) => args[0]);
      expect(allReceived.every((e: any) => e.language === 'fr')).toBe(true);
      const receivedSharedIds = allReceived.map((e: any) => e.sharedId).sort();
      expect(receivedSharedIds).toEqual([
        'entity_1',
        'entity_2',
        'entity_3',
        'entity_4',
        'entity_5',
      ]);
    });

    it('should call onBatch with entities that do not have an _id field', async () => {
      const dao = createSut();
      const onBatch = jest.fn().mockResolvedValue(undefined);
      await dao.cloneForLanguage('en', 'fr', onBatch);

      const allReceived = onBatch.mock.calls.flatMap((args: any[]) => args[0]);
      expect(allReceived.every((e: any) => !('_id' in e))).toBe(true);
    });

    it('should still clone normally when onBatch is not provided', async () => {
      const dao = createSut();
      await dao.cloneForLanguage('en', 'fr');

      const cloned = await testingEnvironment.db
        .getCollection('entities')!
        .find({ language: 'fr' })
        .toArray();

      expect(cloned).toHaveLength(5);
    });
  });

  describe('streamSharedIds()', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    it('returns only sharedId fields, one per MongoDB document, sorted ascending', async () => {
      const dao = createSut();
      const rows = await dao.streamSharedIds().toArray();
      const ids = rows.map(r => r.sharedId);
      // entity_1 has en + es variants → appears twice
      expect(ids).toEqual([...ids].sort());
      expect(ids.every(id => typeof id === 'string')).toBe(true);
      expect(rows.every(r => Object.keys(r).length === 1)).toBe(true);
    });

    it('returns unique sharedIds covering all entities', async () => {
      const dao = createSut();
      const rows = await dao.streamSharedIds().toArray();
      const unique = [...new Set(rows.map(r => r.sharedId))].sort();
      expect(unique).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('with afterSharedId returns only entries lexically after the checkpoint', async () => {
      const dao = createSut();
      const rows = await dao.streamSharedIds({ afterSharedId: 'entity_3' }).toArray();
      const unique = [...new Set(rows.map(r => r.sharedId))].sort();
      expect(unique).toEqual(['entity_4', 'entity_5']);
    });

    it('with afterSharedId returns empty cursor when nothing follows the checkpoint', async () => {
      const dao = createSut();
      const rows = await dao.streamSharedIds({ afterSharedId: 'entity_5' }).toArray();
      expect(rows).toHaveLength(0);
    });
  });

  describe('streamModifiedSince()', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp({
        ...fixtures,
        entities: [
          factory.entity(
            'old_entity',
            'template_1',
            {},
            { language: 'en', editDate: pastDate.getTime() }
          ),
          factory.entity(
            'recent_entity',
            'template_1',
            {},
            { language: 'en', editDate: recentDate.getTime() }
          ),
          factory.entity(
            'boundary_entity',
            'template_1',
            {},
            { language: 'en', editDate: cutoffDate.getTime() }
          ),
        ],
      });
    });

    it('returns only entities whose editDate is >= the given date', async () => {
      const dao = createSut();
      const entities = await dao.streamModifiedSince(cutoffDate).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();
      expect(sharedIds).toEqual(['boundary_entity', 'recent_entity']);
    });

    it('excludes entities updated strictly before the given date', async () => {
      const dao = createSut();
      const entities = await dao.streamModifiedSince(cutoffDate).toArray();
      expect(entities.every(e => e.editDate >= cutoffDate.getTime())).toBe(true);
    });

    it('returns results sorted by sharedId', async () => {
      const dao = createSut();
      const entities = await dao.streamModifiedSince(pastDate).toArray();
      const returnedSharedIds = entities.map(e => e.sharedId);
      expect(returnedSharedIds).toEqual([...returnedSharedIds].sort());
    });
  });

  describe('findBySharedIds()', () => {
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    it('returns all language variants for the given sharedIds', async () => {
      const dao = createSut();
      const entities = await dao.findBySharedIds(['entity_1']);
      const languages = entities.map(e => e.language).sort();
      expect(languages).toEqual(['en', 'es']);
      expect(entities.every(e => e.sharedId === 'entity_1')).toBe(true);
    });

    it('returns entities across multiple sharedIds', async () => {
      const dao = createSut();
      const entities = await dao.findBySharedIds(['entity_2', 'entity_5']);
      const sharedIds = [...new Set(entities.map(e => e.sharedId))].sort();
      expect(sharedIds).toEqual(['entity_2', 'entity_5']);
    });

    it('returns empty array when sharedIds is empty', async () => {
      const dao = createSut();
      const entities = await dao.findBySharedIds([]);
      expect(entities).toHaveLength(0);
    });

    it('returns empty array when no entities match', async () => {
      const dao = createSut();
      const entities = await dao.findBySharedIds(['non_existent']);
      expect(entities).toHaveLength(0);
    });
  });

  describe('getByInternalId()', () => {
    it('returns the entity matching the provided _id with the requested projection', async () => {
      const dao = createSut();
      const [entity] = await dao.findBySharedIds(['entity_1']);

      const found = await dao.getByInternalId(entity._id.toString(), { sharedId: 1, language: 1 });

      expect(found?.sharedId).toBe('entity_1');
      expect(found?.language).toBe('en');
    });

    it('returns null when no entity matches the provided _id', async () => {
      const dao = createSut();
      const found = await dao.getByInternalId(new ObjectId().toString());

      expect(found).toBeNull();
    });
  });
});
