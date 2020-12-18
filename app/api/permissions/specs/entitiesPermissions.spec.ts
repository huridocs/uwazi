import entities from 'api/entities/entities';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import fixtures, { groupA, userA, userB } from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { MixedAccess } from '../../../shared/types/permissionSchema';

describe('permissions', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('set entities permissions', () => {
    it('should update the specified entities with the passed permissions in all entities languages', async () => {
      const permissionsData = {
        ids: ['shared1', 'shared2'],
        permissions: [{ _id: 'user1', type: PermissionType.USER, level: AccessLevels.READ }],
      };
      await entitiesPermissions.setEntitiesPermissions(permissionsData);
      const storedEntities = await entities.get();
      const updateEntities = storedEntities.filter(entity =>
        ['shared1', 'shared2'].includes(entity.sharedId!)
      );
      updateEntities.forEach(entity => {
        expect(entity.permissions).toEqual(permissionsData.permissions);
      });
      const notUpdateEntities = storedEntities.filter(
        entity => !['shared1', 'shared2'].includes(entity.sharedId!)
      );
      notUpdateEntities.forEach(entity => {
        expect(entity.permissions).toBe(undefined);
      });
    });
  });

  describe('get entities permissions', () => {
    it('should return the permissions of the requested entities', async () => {
      const permissions = await entitiesPermissions.getEntitiesPermissions(['shared1', 'shared2']);
      expect(permissions).toEqual([
        {
          _id: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        {
          _id: userA._id,
          label: userA.username,
          level: AccessLevels.READ,
          type: PermissionType.USER,
        },
        {
          _id: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });

    it('should return mixed permissions in case one of the entities does not have any', async () => {
      const permissions = await entitiesPermissions.getEntitiesPermissions(['shared1', 'shared3']);
      expect(permissions).toEqual([
        {
          _id: groupA._id,
          label: groupA.name,
          level: MixedAccess.MIXED,
          type: PermissionType.GROUP,
        },
        {
          _id: userA._id,
          label: userA.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
        {
          _id: userB._id,
          label: userB.username,
          level: MixedAccess.MIXED,
          type: PermissionType.USER,
        },
      ]);
    });
  });
});
