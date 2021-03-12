import { testingDB } from 'api/utils/testing_db';
import entities from 'api/entities/entities';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import { AccessLevels, PermissionType, MixedAccess } from 'shared/types/permissionSchema';
import { fixtures, groupA, userA, userB } from 'api/permissions/specs/fixtures';

describe('permissions', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixtures);
  });

  describe('set entities permissions', () => {
    it('should update the specified entities with the passed permissions in all entities languages', async () => {
      const permissionsData = {
        ids: ['shared1', 'shared2'],
        permissions: [
          { refId: 'user1', type: PermissionType.USER, level: AccessLevels.READ },
          { refId: 'user2', type: PermissionType.USER, level: AccessLevels.WRITE },
        ],
      };
      await entitiesPermissions.set(permissionsData);
      const storedEntities = await entities.get();
      const updateEntities = storedEntities.filter(entity =>
        ['shared1', 'shared2'].includes(entity.sharedId!)
      );
      updateEntities.forEach(entity => {
        expect(entity.permissions).toEqual(permissionsData.permissions);
      });
      const notUpdatedEntities = storedEntities.filter(
        entity => !['shared1', 'shared2'].includes(entity.sharedId!)
      );
      notUpdatedEntities.forEach(entity => {
        expect(entity.permissions).toBe(undefined);
      });
    });

    it('should invalidate if permissions are duplicated', async () => {
      const permissionsData = {
        ids: ['shared1'],
        permissions: [
          { refId: 'user1', type: 'user', level: 'write' },
          { refId: 'user1', type: 'user', level: 'read' },
        ],
      };
      try {
        await entitiesPermissions.set(permissionsData);
        fail('should throw error');
      } catch (e) {
        expect(e.errors[0].keyword).toEqual('duplicatedPermissions');
      }
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
  });
});
