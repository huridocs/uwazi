import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { BulkGrantEntityPermissionsUseCaseFactory } from '#api/core/infrastructure/factories/BulkGrantEntityPermissionsUseCaseFactory.js';
import { EntityAccessPolicyDataSourceFactory } from '#api/core/infrastructure/factories/EntityAccessPolicyDataSourceFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { InsufficientPermissionsToPublishError } from '#api/core/application/errors.js';
import { EntityIndexerServiceFactory } from '#api/core/infrastructure/factories/EntityIndexerServiceFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';

const sharedId1 = 'bulk-entity-1';
const sharedId2 = 'bulk-entity-2';
const sharedId3 = 'bulk-entity-3';
const sharedId4 = 'bulk-entity-4';

const fixtures: DBFixture = {
  entities: [
    {
      _id: new ObjectId(),
      sharedId: sharedId1,
      language: 'en',
      published: false,
      permissions: [{ refId: 'existing-user', type: GrantType.User, level: AccessLevel.Read }],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId1,
      language: 'es',
      published: false,
      permissions: [{ refId: 'existing-user', type: GrantType.User, level: AccessLevel.Read }],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId2,
      language: 'en',
      published: false,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId2,
      language: 'es',
      published: false,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId3,
      language: 'en',
      published: true,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId3,
      language: 'es',
      published: true,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId4,
      language: 'en',
      published: true,
      permissions: [],
    },
    {
      _id: new ObjectId(),
      sharedId: sharedId4,
      language: 'es',
      published: true,
      permissions: [],
    },
  ],
};

const admin = new User('admin-id', 'admin', []);
const collaborator = new User('collab-id', 'collaborator', []);

const createSut = (actor: User) =>
  testingEnvironment.runWithContext(
    () => ({
      sut: BulkGrantEntityPermissionsUseCaseFactory.default({
        entityAccessPolicyDS: EntityAccessPolicyDataSourceFactory.default({
          entityIndexerService: EntityIndexerServiceFactory.forTests(),
        }),
      }),
    }),
    { actor }
  );

describe('BulkGrantEntityPermissions', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('grant merging', () => {
    it('upserts provided grants while preserving existing grants for unmentioned refIds', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId1],
        grants: [{ refId: 'new-user', type: GrantType.User, level: AccessLevel.Write }],
        isPublic: undefined,
      });

      const docs = await getConnection()
        .collection('entities')
        .find({ sharedId: sharedId1 })
        .toArray();

      docs.forEach(doc => {
        // existing-user grant must still be present
        expect(doc.permissions).toContainEqual({
          refId: 'existing-user',
          type: GrantType.User,
          level: AccessLevel.Read,
        });
        // new grant must be added
        expect(doc.permissions).toContainEqual({
          refId: 'new-user',
          type: GrantType.User,
          level: AccessLevel.Write,
        });
      });
    });

    it('updates the level of an existing refId', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId1],
        grants: [{ refId: 'existing-user', type: GrantType.User, level: AccessLevel.Write }],
        isPublic: undefined,
      });

      const doc = await getConnection().collection('entities').findOne({ sharedId: sharedId1 });

      expect(doc!.permissions).toEqual([
        { refId: 'existing-user', type: GrantType.User, level: AccessLevel.Write },
      ]);
    });

    it('applies grants uniformly to all entities in the list', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId1, sharedId2],
        grants: [{ refId: 'shared-user', type: GrantType.Group, level: AccessLevel.Read }],
        isPublic: undefined,
      });

      for (const sharedId of [sharedId1, sharedId2]) {
        // eslint-disable-next-line no-await-in-loop
        const doc = await getConnection().collection('entities').findOne({ sharedId });
        expect(doc!.permissions).toContainEqual({
          refId: 'shared-user',
          type: GrantType.Group,
          level: AccessLevel.Read,
        });
      }
    });
  });

  describe('isPublic handling', () => {
    it('does not change published when isPublic is undefined', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId3, sharedId4],
        grants: [],
        isPublic: undefined,
      });

      const docs = await getConnection()
        .collection('entities')
        .find({ sharedId: { $in: [sharedId3, sharedId4] } })
        .toArray();

      docs.forEach(doc => expect(doc.published).toBe(true));
    });

    it('sets published to true on all entities when isPublic is true', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId1, sharedId2],
        grants: [],
        isPublic: true,
      });

      const docs = await getConnection()
        .collection('entities')
        .find({ sharedId: { $in: [sharedId1, sharedId2] } })
        .toArray();

      docs.forEach(doc => expect(doc.published).toBe(true));
    });

    it('sets published to false on all entities when isPublic is false', async () => {
      const { sut } = createSut(admin);

      await sut.execute({
        sharedIds: [sharedId3, sharedId4],
        grants: [],
        isPublic: false,
      });

      const docs = await getConnection()
        .collection('entities')
        .find({ sharedId: { $in: [sharedId3, sharedId4] } })
        .toArray();

      docs.forEach(doc => expect(doc.published).toBe(false));
    });
  });

  describe('collaborator permission check', () => {
    it('throws InsufficientPermissionsToPublishError when collaborator tries to change isPublic', async () => {
      const { sut } = createSut(collaborator);

      await expect(
        sut.execute({ sharedIds: [sharedId1], grants: [], isPublic: true })
      ).rejects.toBeInstanceOf(InsufficientPermissionsToPublishError);
    });

    it('allows collaborator to update grants when isPublic is undefined', async () => {
      const { sut } = createSut(collaborator);

      await expect(
        sut.execute({
          sharedIds: [sharedId1],
          grants: [{ refId: 'collab-id', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: undefined,
        })
      ).resolves.toBeUndefined();
    });

    it('allows collaborator to update grants when isPublic matches current value', async () => {
      const { sut } = createSut(collaborator);

      // sharedId1 and sharedId2 are both published: false
      await expect(
        sut.execute({
          sharedIds: [sharedId1, sharedId2],
          grants: [{ refId: 'collab-id', type: GrantType.User, level: AccessLevel.Write }],
          isPublic: false, // same as current
        })
      ).resolves.toBeUndefined();
    });
  });
});
