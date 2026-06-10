import { entitiesPermissions } from '#api/permissions/entitiesPermissions.js';
import { fixtures, groupA, userA, userB } from '#api/permissions/specs/fixtures.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { AccessLevels, MixedAccess, PermissionType } from '#shared/types/permissionSchema.js';
import { PUBLIC_PERMISSION } from '../publicPermission.js';

const publicPermission = {
  ...PUBLIC_PERMISSION,
  level: AccessLevels.READ,
};

describe('permissions', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
