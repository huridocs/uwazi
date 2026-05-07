import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { GrantEntityPermissionsUseCaseFactory } from '#api/core/infrastructure/factories/GrantEntityPermissionsUseCaseFactory.js';
import { EntityAccessPolicyDataSourceFactory } from '#api/core/infrastructure/factories/EntityAccessPolicyDataSourceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { EntityAccessPolicyNotFoundError } from '#api/core/domain/entityAccessPolicy/errors.js';
import { InsufficientPermissionsToPublishError } from '#api/core/application/errors.js';
import { EntityIndexerServiceFactory } from '#api/core/infrastructure/factories/EntityIndexerServiceFactory.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';

const sharedId = 'entity-grant-1';

const fixtures = {
  entities: [
    {
      _id: new ObjectId(),
      sharedId,
      language: 'en',
      published: false,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId,
      language: 'es',
      published: false,
      permissions: [],
    },
  ],
};

const admin = new User('admin-id', 'admin', []);
const collaborator = new User('collab-id', 'collaborator', []);

const createSut = (actor: User) => {
  const deps = testingEnvironment.runWithContext(
    () => {
      const entityIndexerService = EntityIndexerServiceFactory.forTests();

      const entityAccessPolicyDS = EntityAccessPolicyDataSourceFactory.default({
        entityIndexerService,
      });

      return {
        sut: GrantEntityPermissionsUseCaseFactory.default({
          entityAccessPolicyDS,
        }),
        entityIndexerService,
      };
    },
    { actor }
  );

  return deps;
};

describe('GrantEntityPermissions', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('happy path', () => {
    it('saves grants and isPublic (full replacement) for admin', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedId,
        grants: [{ refId: 'user-1', type: GrantType.User, level: AccessLevel.Write }],
        isPublic: true,
      });

      const docs = await getConnection().collection('entities').find({ sharedId }).toArray();
      expect(docs).toHaveLength(2);
      docs.forEach(doc => {
        expect(doc.published).toBe(true);
        expect(doc.permissions).toContainEqual({
          refId: 'user-1',
          type: GrantType.User,
          level: AccessLevel.Write,
        });
        expect(doc.permissions).toContainEqual({
          refId: 'public',
          type: 'public',
          level: AccessLevel.Read,
        });
      });
    });

    it('replaces existing grants entirely', async () => {
      const { sut } = createSut(admin);

      // First call sets two grants
      await sut.execute({
        sharedId,
        grants: [
          { refId: 'user-1', type: GrantType.User, level: AccessLevel.Write },
          { refId: 'user-2', type: GrantType.User, level: AccessLevel.Read },
        ],
        isPublic: false,
      });

      // Second call replaces with a single grant
      await sut.execute({
        sharedId,
        grants: [{ refId: 'user-3', type: GrantType.Group, level: AccessLevel.Read }],
        isPublic: false,
      });

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc!.permissions).toEqual([
        { refId: 'user-3', type: GrantType.Group, level: AccessLevel.Read },
      ]);
    });
  });

  describe('collaborator changing isPublic', () => {
    it('throws InsufficientPermissionsToPublishError when collaborator changes isPublic from false to true', async () => {
      const { sut } = createSut(collaborator);

      await expect(sut.execute({ sharedId, grants: [], isPublic: true })).rejects.toBeInstanceOf(
        InsufficientPermissionsToPublishError
      );
    });

    it('throws InsufficientPermissionsToPublishError when collaborator changes isPublic from true to false', async () => {
      // Seed as public
      const { sut: adminSut } = createSut(admin);
      await adminSut.execute({ sharedId, grants: [], isPublic: true });

      const { sut } = createSut(collaborator);
      await expect(sut.execute({ sharedId, grants: [], isPublic: false })).rejects.toBeInstanceOf(
        InsufficientPermissionsToPublishError
      );
    });

    it('allows collaborator to update grants when isPublic is unchanged', async () => {
      const { sut } = createSut(collaborator);

      await expect(
        sut.execute({
          sharedId,
          grants: [{ refId: 'collab-id', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: false, // matches current DB value
        })
      ).resolves.toBeUndefined();

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc!.permissions).toEqual([
        { refId: 'collab-id', type: GrantType.User, level: AccessLevel.Write },
      ]);
    });
  });

  describe('admin changing isPublic', () => {
    it('allows admin to set isPublic to true', async () => {
      const { sut } = createSut(admin);

      await expect(sut.execute({ sharedId, grants: [], isPublic: true })).resolves.toBeUndefined();

      const doc = await getConnection().collection('entities').findOne({ sharedId });
      expect(doc!.published).toBe(true);
    });
  });

  describe('unknown sharedId', () => {
    it('throws EntityAccessPolicyNotFoundError', async () => {
      const { sut } = createSut(admin);

      await expect(
        sut.execute({ sharedId: 'does-not-exist', grants: [], isPublic: false })
      ).rejects.toBeInstanceOf(EntityAccessPolicyNotFoundError);
    });
  });
});
