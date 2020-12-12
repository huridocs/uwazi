import entities from 'api/entities/entities';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import fixtures, { groupA, userA, userB } from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';

describe('permissions', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('set entities permissions', () => {
    it('should update the specified entities with the passed permissions in all entities languages', async () => {
      const permissionsData = {
        ids: ['shared1', 'shared2'],
        permissions: [{ _id: 'user1', type: 'user', level: 'read' }],
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
          _id: userA._id,
          label: userA.username,
          role: userA.role,
          level: 'mixed',
          type: 'user',
        },
        {
          _id: userB._id,
          label: userB.username,
          role: userB.role,
          level: 'write',
          type: 'user',
        },
        {
          _id: groupA._id,
          label: groupA.name,
          level: 'mixed',
          type: 'group',
        },
      ]);
    });
  });
});
