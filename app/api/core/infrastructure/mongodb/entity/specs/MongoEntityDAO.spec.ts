import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoEntityDAO } from '../MongoEntityDAO.js';

const factory = getFixturesFactory();

const adminUser = new User(factory.id('admin_user').toString(), 'admin', []);
const editorUser = new User(factory.id('editor_user').toString(), 'editor', []);
const collaboratorUser = new User(factory.id('collab_user').toString(), 'collaborator', [
  factory.id('collab_group').toString(),
]);
const otherCollaborator = new User(factory.id('other_collab').toString(), 'collaborator', []);
const publicUser = User.createFrom(null);

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

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createSut = (user: User = adminUser) =>
  new MongoEntityDAO(getConnection(), TransactionManagerFactory.default(), user);

describe('MongoEntityDAO', () => {
  describe('getWithFiles()', () => {
    // eslint-disable-next-line max-statements
    it('should return entity with files separated as documents and attachments', async () => {
      const dao = createSut();
      const result = dao.getWithFiles({ sharedId: 'entity_1', language: 'en' });
      const entities = await result.toArray();
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
      const result = dao.getWithFiles({ sharedId: 'non_existent', language: 'en' });
      const entities = await result.toArray();

      expect(entities).toHaveLength(0);
    });
  });

  describe('permission filtering', () => {
    it('should return all entities for admin users', async () => {
      const dao = createSut(adminUser);
      const entities = await dao.getWithFiles({ language: 'en' }).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return all entities for editor users', async () => {
      const dao = createSut(editorUser);
      const entities = await dao.getWithFiles({ language: 'en' }).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return only published entities for public users', async () => {
      const dao = createSut(publicUser);
      const entities = await dao.getWithFiles({ language: 'en' }).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_5']);
    });

    it('should return published + explicitly shared entities for collaborator', async () => {
      const dao = createSut(collaboratorUser);
      const entities = await dao.getWithFiles({ language: 'en' }).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();

      // entity_1: published + has user permission
      // entity_3: unpublished, has user permission for collab_user
      // entity_4: unpublished, has group permission for collab_group
      // entity_5: published, no permissions
      expect(sharedIds).toEqual(['entity_1', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('should return only published entities for collaborator without matching permissions', async () => {
      const dao = createSut(otherCollaborator);
      const entities = await dao.getWithFiles({ language: 'en' }).toArray();
      const sharedIds = entities.map(e => e.sharedId).sort();

      expect(sharedIds).toEqual(['entity_1', 'entity_5']);
    });

    it('should not return an unpublished entity to public user even when queried by sharedId', async () => {
      const dao = createSut(publicUser);
      const entities = await dao.getWithFiles({ sharedId: 'entity_2', language: 'en' }).toArray();

      expect(entities).toHaveLength(0);
    });

    it('should return unpublished entity shared with collaborator via group permission', async () => {
      const dao = createSut(collaboratorUser);
      const entities = await dao.getWithFiles({ sharedId: 'entity_4', language: 'en' }).toArray();

      expect(entities).toHaveLength(1);
      expect(entities[0].sharedId).toBe('entity_4');
    });
  });
});
