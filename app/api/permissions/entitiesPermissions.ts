import entities from 'api/entities/entities';
import users from 'api/users/users';
import { GrantedPermissionSchema, PermissionsSchema } from 'shared/types/permissionsType';

export const entitiesPermissions = {
  setEntitiesPermissions: async (permissionsData: any) => {
    await entities.multipleUpdate(
      permissionsData.ids,
      {
        permissions: permissionsData.permissions,
      },
      { language: 'en' }
    );
  },
  getEntitiesPermissions: async (query: any) => {
    const entitiesPermissionsData: PermissionsSchema[] = (
      await entities.get({ sharedId: { $in: query.id } }, { permissions: 1 })
    )
      .map(entity => entity.permissions as PermissionsSchema)
      .filter(p => p);

    const groupsResult: GrantedPermissionSchema[] = [];
    const usersResult: GrantedPermissionSchema[] = [];
    entitiesPermissionsData.forEach(permissions => {
      permissions.forEach(permission => {
        if (permission.type === 'user') {
          usersResult.push(permission as GrantedPermissionSchema);
        } else {
          groupsResult.push(permission as GrantedPermissionSchema);
        }
      });
    });
    const userIds = usersResult.map(user => user._id);
    const usersData = await users.get({ _id: { $in: userIds } });
    usersResult.forEach(user => {
      const userData = usersData.find(u => u._id.equals(user._id));
      if (userData && userData.username) {
        user.label = userData.username;
      }
    });
    return usersResult;
  },
};
