/* eslint-disable max-lines */
import { testingDB } from 'api/utils/testing_db';
import entities from 'api/entities/entities';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { AccessLevels, PermissionType, MixedAccess } from 'shared/types/permissionSchema';
import { search } from 'api/search';
import { fixtures, groupA, userA, userB } from 'api/permissions/specs/fixtures';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { PUBLIC_PERMISSION } from '../publicPermission';

const publicPermission = {
  ...PUBLIC_PERMISSION,
  level: AccessLevels.READ,
};

const mockCollab = () =>
  new UserInContextMockFactory().mock({
    _id: 'userId',
    role: 'collaborator',
    username: 'username',
    email: 'email',
  });

describe('permissions', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('set entities permissions', () => {
    it('should update the specified entities with the passed permissions in all entities languages and make no other changes', async () => {
      const originalEntities = await entities.getUnrestricted({}, 'sharedId +permissions');
      const originalUpdatedEntities = originalEntities.filter(entity =>
        ['shared1', 'shared2'].includes(entity.sharedId!)
      );
      const originalNotUpdatedEntities = originalEntities.filter(
        entity => !['shared1', 'shared2'].includes(entity.sharedId!)
      );

      const permissionsData: PermissionsDataSchema = {
        ids: ['shared1', 'shared2'],
        permissions: [
          { refId: 'user1', type: PermissionType.USER, level: AccessLevels.READ },
          { refId: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE },
          publicPermission,
        ],
      };
      await entitiesPermissions.set(permissionsData);
      mockCollab();
      const storedEntities = await entities.getUnrestricted({}, 'sharedId +permissions');
      const updateEntities = storedEntities.filter(entity =>
        ['shared1', 'shared2'].includes(entity.sharedId!)
      );
      const expectedNewPermissions = permissionsData.permissions.filter(
        p => p.type !== PermissionType.PUBLIC
      );
      updateEntities.forEach((entity, index) => {
        const original = originalUpdatedEntities[index];
        expect(entity).toEqual({
          ...original,
          permissions: expectedNewPermissions,
        });
      });
      const notUpdatedEntities = storedEntities.filter(
        entity => !['shared1', 'shared2'].includes(entity.sharedId!)
      );
      expect(notUpdatedEntities).toEqual(originalNotUpdatedEntities);
    });

    it('should invalidate if permissions are duplicated', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['shared1'],
        permissions: [
          { refId: 'user1', type: 'user', level: 'write' },
          { refId: 'user1', type: 'user', level: 'read' },
        ],
      };
      mockCollab();

      try {
        await entitiesPermissions.set(permissionsData);
        fail('should throw error');
      } catch (e) {
        expect(e.errors[0].keyword).toEqual('duplicatedPermissions');
      }
    });

    it('should preserve permission level if mixed access passed', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['shared2', 'shared4'],
        permissions: [
          {
            refId: userA._id,
            type: PermissionType.USER,
            level: AccessLevels.WRITE,
          },
          {
            refId: groupA._id,
            type: PermissionType.GROUP,
            level: MixedAccess.MIXED,
          },
          { ...publicPermission, level: MixedAccess.MIXED },
        ],
      };

      await entitiesPermissions.set(permissionsData);

      const storedEntities = await entities.getUnrestricted(
        { sharedId: { $in: permissionsData.ids } },
        'sharedId published +permissions'
      );

      expect(storedEntities[0].permissions?.length).toBe(2);
      expect(storedEntities[0].permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            refId: userA._id,
            level: AccessLevels.WRITE,
          }),
          expect.objectContaining({
            refId: groupA._id,
            level: AccessLevels.READ,
          }),
        ])
      );
      expect(storedEntities[0].published).toBe(true);

      expect(storedEntities[2].permissions?.length).toBe(1);
      expect(storedEntities[2].permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            refId: userA._id,
            level: AccessLevels.WRITE,
          }),
        ])
      );
      expect(storedEntities[2].published).toBe(false);
    });

    it('should reindex the entities after updating the permissions', async () => {
      const indexEntitiesSpy = jest.spyOn(search, 'indexEntities');

      const permissionsData: PermissionsDataSchema = {
        ids: ['shared1'],
        permissions: [publicPermission],
      };

      await entitiesPermissions.set(permissionsData);
      const storedEntities = (await entities.get({ sharedId: 'shared1' })) as EntitySchema[];
      const ids = storedEntities.map(entity => entity._id);
      expect(indexEntitiesSpy).toHaveBeenCalledWith({ _id: { $in: ids } }, '+fullText');

      indexEntitiesSpy.mockRestore();
    });

    describe('share publicly', () => {
      it('should save the entity with the publish field set to the correct value', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['shared1', 'shared2'],
          permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
        };

        new UserInContextMockFactory().mockEditorUser();

        await entitiesPermissions.set(permissionsData);
        let storedEntities: EntityWithFilesSchema[] = await entities.get(
          { sharedId: 'shared1' },
          '+permissions'
        );

        storedEntities.forEach(entity => {
          expect(entity.permissions).toEqual(permissionsData.permissions);
          expect(entity.published).toBe(false);
        });

        permissionsData.permissions.push({ ...PUBLIC_PERMISSION, level: 'read' });
        await entitiesPermissions.set(permissionsData);
        storedEntities = await entities.get({ sharedId: 'shared1' }, '+permissions');

        storedEntities.forEach(entity => {
          expect(entity.permissions).toEqual([permissionsData.permissions[0]]);
          expect(entity.published).toBe(true);
        });
      });

      it('should throw if non admin/editor changes the publishing status', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['shared1'],
          permissions: [{ refId: 'user1', type: 'user', level: 'write' }],
        };

        mockCollab();

        try {
          await entitiesPermissions.set(permissionsData);
          fail('should throw forbidden exception');
        } catch (e) {
          const storedEntities = await entities.get({ sharedId: 'shared1' });
          expect(storedEntities[0].published).toBe(true);
        }
      });
    });
  });

  describe('get entities permissions', () => {
    it('should return the permissions of the requested entities', async () => {
      const permissions = await entitiesPermissions.get(['shared1', 'shared2']);
      expect(permissions).toEqual([
        {
          refId: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        publicPermission,
        {
          refId: userA._id,
          label: userA.username,
          level: AccessLevels.READ,
          type: PermissionType.USER,
        },
        {
          refId: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });

    it('should return mixed permissions in case one of the entities does not have any', async () => {
      const permissions = await entitiesPermissions.get(['shared1', 'shared3']);
      expect(permissions).toEqual([
        {
          refId: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        publicPermission,
        {
          refId: userA._id,
          label: userA.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
        {
          refId: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });

    describe('publicly shared', () => {
      it('should return a permission of type "public" and level "mixed" if the entities are published and unpublished', async () => {
        const permissions = await entitiesPermissions.get(['shared1', 'shared4']);
        expect(permissions).toEqual(
          expect.arrayContaining([{ ...publicPermission, level: MixedAccess.MIXED }])
        );
      });

      it('should return a permission of type "public" and level "read" if the entity is published', async () => {
        const permissions = await entitiesPermissions.get(['shared1']);
        expect(permissions).toEqual(expect.arrayContaining([publicPermission]));
      });

      it('should NOT return a permission of type "public" if the entity is not published', async () => {
        const permissions = await entitiesPermissions.get(['shared4']);
        expect(permissions).toEqual([]);
      });
    });
  });
});
