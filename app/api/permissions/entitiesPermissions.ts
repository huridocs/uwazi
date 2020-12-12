import entities from 'api/entities/entities';
import users from 'api/users/users';
import {
  GrantedPermissionSchema,
  PermissionSchema,
  PermissionsSchema,
} from 'shared/types/permissionsType';
import userGroups from 'api/usergroups/userGroups';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';

const addGrantedPermission = (
  grantedPermissions: PermissionSchema[],
  permission: PermissionSchema
) => {
  const grantedPermission = grantedPermissions.find(
    gp => gp._id.toString() === permission._id.toString()
  );
  if (grantedPermission) {
    if (grantedPermission.level !== permission.level) {
      grantedPermission.level = 'mixed';
    }
  } else {
    grantedPermissions.push(permission);
  }
};

const setAdditionalData = (
  peopleList: (GroupMemberSchema | UserGroupSchema)[],
  permission: PermissionSchema,
  additional: (data: GroupMemberSchema | UserGroupSchema) => {}
) => {
  const userData = peopleList.find(u => u._id!.toString() === permission._id.toString());
  return userData ? { ...permission, ...additional(userData) } : undefined;
};

export const entitiesPermissions = {
  setEntitiesPermissions: async (permissionsData: any) => {
    const currentEntities = await entities.get({ sharedId: { $in: permissionsData.ids } });
    const toSave = currentEntities.map(entity => ({
      ...entity,
      permissions: permissionsData.permissions,
    }));
    await entities.saveMultiple(toSave);
  },

  getEntitiesPermissions: async (sharedIds: string[]) => {
    const entitiesPermissionsData: PermissionsSchema[] = (
      await entities.get({ sharedId: { $in: sharedIds } }, { permissions: 1 })
    )
      .map(entity => entity.permissions as PermissionsSchema)
      .filter(p => p);

    const grantedPermissions: GrantedPermissionSchema[] = [];
    entitiesPermissionsData.forEach(permissions => {
      permissions.forEach(permission => {
        addGrantedPermission(grantedPermissions, permission);
      });
    });

    const grantedIds = entitiesPermissionsData.reduce(
      (ids: string[], permissions: PermissionSchema[]) => {
        permissions.forEach(permission => ids.push(permission._id.toString()));
        return ids;
      },
      []
    );

    const usersData: GroupMemberSchema[] = await users.get({ _id: { $in: grantedIds } });
    const groupsData: UserGroupSchema[] = await userGroups.get({ _id: { $in: grantedIds } });

    return grantedPermissions.map(permission => {
      const sourceData = permission.type === 'user' ? usersData : groupsData;
      const additional =
        permission.type === 'user'
          ? (p: any) => ({ label: p.username, role: p.role })
          : (g: any) => ({ label: g.name });
      return setAdditionalData(sourceData, permission, additional);
    });
  },
};
