import entities from 'api/entities/entities';
import { entitiesPermissions } from 'api/permissions/entitiesPermissions';
import fixtures from 'api/permissions/specs/fixtures';
import db from 'api/utils/testing_db';

describe('permissions', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  describe('set entities permissions', () => {
    it('should update all entities with the passed permissions', async () => {
      const permissionsData = {
        ids: ['shared1', 'shared2'],
        permissions: [{ _id: 'user1', type: 'user', permission: 'read' }],
      };
      await entitiesPermissions.setEntitiesPermissions(permissionsData);
      const storedEntities = await entities.get();
      expect(storedEntities[0].permissions).toEqual(permissionsData.permissions);
      expect(storedEntities[1].permissions).toEqual(permissionsData.permissions);
      expect(storedEntities[2].permissions).toBe(undefined);
    });
  });
});
