import entities from 'api/entities/entities';
import users from 'api/users/users';
import { GrantedPermissionSchema, PermissionsSchema } from 'shared/types/permissionsType';
import { Roles } from 'shared/types/permissionsSchema';
import userGroups from 'api/usergroups/userGroups';

export const entitiesPermissions = {
  setEntitiesPermissions: async (permissionsData: any) => {
    const currentEntities = await entities.get({ sharedId: { $in: permissionsData.ids } });
    const toSave = currentEntities.map(entity => ({
      ...entity,
      permissions: permissionsData.permissions,
    }));
    await entities.saveMultiple(toSave);
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
          const userPermission = usersResult.find(user => user._id.toString() === permission._id);
          if (userPermission) {
            if (userPermission.level !== permission.level) {
              userPermission.level = 'mixed';
            }
          } else {
            usersResult.push(permission as GrantedPermissionSchema);
          }
        } else {
          const groupPermission = groupsResult.find(
            group => group._id.toString() === permission._id
          );
          if (groupPermission) {
            if (groupPermission.level !== permission.level) {
              groupPermission.level = 'mixed';
            }
          } else {
            groupsResult.push(permission as GrantedPermissionSchema);
          }
        }
      });
    });
    const userIds = usersResult.map(user => user._id);
    const usersData = await users.get({ _id: { $in: userIds } });
    usersResult.forEach(user => {
      const userData = usersData.find(u => u._id.equals(user._id));
      if (userData && userData.username) {
        user.label = userData.username;
        user.role = <Roles>userData.role;
      }
    });
    const groupIds = groupsResult.map(group => group._id);
    const groupsData = await userGroups.get({ _id: { $in: groupIds } });
    groupsResult.forEach(group => {
      const groupData = groupsData.find(g => g._id!.toString() === group._id);
      if (groupData) {
        group.label = groupData.name;
      }
    });
    return usersResult.concat(groupsResult);
  },
};
