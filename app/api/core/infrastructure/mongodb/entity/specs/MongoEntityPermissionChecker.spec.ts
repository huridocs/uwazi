import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { Specification } from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { MongoEntityPermissionChecker } from '../MongoEntityPermissionChecker.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';

const factory = getFixturesFactory();

const adminUser = new User(factory.id('admin_user').toString(), 'admin', []);
const editorUser = new User(factory.id('editor_user').toString(), 'editor', []);
const collaboratorUser = new User(factory.id('collab_user').toString(), 'collaborator', [
  factory.id('collab_group').toString(),
]);
const otherCollaborator = new User(factory.id('other_collab').toString(), 'collaborator', []);
const anonymousUser = User.createFrom(null);

const entityFile = (entitySharedId: string) =>
  FileBuilder.attachment('file-for-check', { entity: entitySharedId });

const customFile = () => FileBuilder.customUpload('custom-for-check');

const readSpec = (actor: User) =>
  new Specification({ type: GrantType.User, level: AccessLevel.Read, actor });

const writeSpec = (actor: User) => Specification.createDeleteSpecification(actor);

const fixtures: DBFixture = {
  settings: [
    {
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],

  templates: [factory.template('template_1', [])],

  entities: [
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

    factory.entity('entity_2', 'template_1', {}, { language: 'en' }),

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

    factory.entity('entity_5', 'template_1', {}, { language: 'en', published: true }),

    factory.entity(
      'entity_read_only',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [
          { refId: collaboratorUser._id, type: 'user' as const, level: 'read' as const },
        ],
      }
    ),

    factory.entity(
      'entity_write_collab',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [
          { refId: collaboratorUser._id, type: 'user' as const, level: 'write' as const },
        ],
      }
    ),

    factory.entity(
      'entity_write_editor',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [{ refId: editorUser._id, type: 'user' as const, level: 'write' as const }],
      }
    ),

    factory.entity(
      'entity_write_group',
      'template_1',
      {},
      {
        language: 'en',
        permissions: [
          { refId: collaboratorUser.groups[0], type: 'group' as const, level: 'write' as const },
        ],
      }
    ),
  ],
};

const ALL_SHARED_IDS = ['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5'];

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createSut = () =>
  new MongoEntityPermissionChecker(getConnection(), TransactionManagerFactory.default());

describe('MongoEntityPermissionChecker', () => {
  describe('filterEntities() — Read spec', () => {
    it('admin: returns all sharedIds including unpublished', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, readSpec(adminUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('editor: returns all sharedIds including unpublished', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, readSpec(editorUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('anonymous: returns only published sharedIds', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, readSpec(anonymousUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_5']);
    });

    it('collaborator with direct user permission: returns published + user-permissioned', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, readSpec(collaboratorUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('collaborator with group permission: returns group-permissioned entities', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(['entity_4', 'entity_2'], readSpec(collaboratorUser));
      expect(result.sort()).toEqual(['entity_4']);
    });

    it('collaborator without any matching permission: returns only published', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, readSpec(otherCollaborator));
      expect(result.sort()).toEqual(['entity_1', 'entity_5']);
    });

    it('empty input: returns empty array', async () => {
      const sut = createSut();
      const result = await sut.filterEntities([], readSpec(adminUser));
      expect(result).toEqual([]);
    });

    it('non-existent sharedIds: returns empty array (not an error)', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(
        ['does_not_exist', 'also_missing'],
        readSpec(adminUser)
      );
      expect(result).toEqual([]);
    });

    it('subset: some entities accessible, some not — returns only the accessible ones', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(['entity_1', 'entity_2'], readSpec(anonymousUser));
      expect(result).toEqual(['entity_1']);
    });
  });

  describe('filterEntities() — Write spec', () => {
    it('admin: returns all sharedIds', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, writeSpec(adminUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('editor: returns all sharedIds', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, writeSpec(editorUser));
      expect(result.sort()).toEqual(['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5']);
    });

    it('collaborator with WRITE permission: returns only WRITE-permissioned entities', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, writeSpec(collaboratorUser));
      expect(result).toEqual(['entity_1']);
    });

    it('collaborator with READ-only permission: returns empty array (READ is insufficient for write spec)', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(['entity_3'], writeSpec(collaboratorUser));
      expect(result).toEqual([]);
    });

    it('anonymous: returns empty array', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, writeSpec(anonymousUser));
      expect(result).toEqual([]);
    });

    it('collaborator without any permission: returns empty array', async () => {
      const sut = createSut();
      const result = await sut.filterEntities(ALL_SHARED_IDS, writeSpec(otherCollaborator));
      expect(result).toEqual([]);
    });
  });

  describe('checkWritePermission()', () => {
    describe('anonymous user', () => {
      it('is always denied', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(entityFile('entity_1'), anonymousUser);
        expect(result.getDataOrThrow()).toBe(false);
      });
    });

    describe('admin user', () => {
      it('is allowed on entity files', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(entityFile('entity_1'), adminUser);
        expect(result.getDataOrThrow()).toBe(true);
      });

      it('is allowed on custom (non-entity) files', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(customFile(), adminUser);
        expect(result.getDataOrThrow()).toBe(true);
      });
    });

    describe('editor user', () => {
      it('is denied on custom (non-entity) files', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(customFile(), editorUser);
        expect(result.getDataOrThrow()).toBe(false);
      });

      it('is denied on entity files when the editor has no explicit permission', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(entityFile('entity_2'), editorUser);
        expect(result.getDataOrThrow()).toBe(false);
      });

      it('is allowed on entity files when the editor has explicit write permission', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('entity_write_editor'),
          editorUser
        );
        expect(result.getDataOrThrow()).toBe(true);
      });

      it('is denied on entity files when the editor has only read-level permission', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(entityFile('entity_read_only'), editorUser);
        expect(result.getDataOrThrow()).toBe(false);
      });
    });

    describe('collaborator user', () => {
      it('is denied on custom (non-entity) files', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(customFile(), collaboratorUser);
        expect(result.getDataOrThrow()).toBe(false);
      });

      it('is denied on entity files with no permissions', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(entityFile('entity_2'), collaboratorUser);
        expect(result.getDataOrThrow()).toBe(false);
      });

      it('is denied on entity files where the user has only read-level permission', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('entity_read_only'),
          collaboratorUser
        );
        expect(result.getDataOrThrow()).toBe(false);
      });

      it('is allowed on entity files where the user has explicit write permission (direct)', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('entity_write_collab'),
          collaboratorUser
        );
        expect(result.getDataOrThrow()).toBe(true);
      });

      it('is allowed on entity files where the user belongs to a group with write permission', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('entity_write_group'),
          collaboratorUser
        );
        expect(result.getDataOrThrow()).toBe(true);
      });

      it('other collaborator (not in permissions) is denied', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('entity_write_collab'),
          otherCollaborator
        );
        expect(result.getDataOrThrow()).toBe(false);
      });
    });

    describe('entity not found in DB', () => {
      it('returns false instead of throwing', async () => {
        const sut = createSut();
        const result = await sut.checkWritePermission(
          entityFile('does_not_exist'),
          collaboratorUser
        );
        expect(result.getDataOrThrow()).toBe(false);
      });
    });
  });
});
