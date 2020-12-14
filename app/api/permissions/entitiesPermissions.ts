import entities from 'api/entities/entities';
import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { unique } from 'api/utils/filters';
import { PermissionSchema, PermissionsSchema } from 'shared/types/permissionsType';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { AccessLevels } from 'shared/types/permissionsSchema';

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
    ).map(entity => entity.permissions as PermissionsSchema);

    const grantedPermissions: {
      [k: string]: { permission: PermissionSchema; access: AccessLevels[] };
    } = {};
    entitiesPermissionsData
      .filter(p => p)
      .forEach(entityPermissions => {
        entityPermissions.forEach(permission => {
          const grantedPermission = grantedPermissions[permission._id.toString()];
          if (grantedPermission) {
            grantedPermission.access.push(permission.level);
          } else {
            grantedPermissions[permission._id.toString()] = {
              permission,
              access: [permission.level],
            };
          }
        });
      });

    const grantedIds = Object.keys(grantedPermissions);
    const [usersData, groupsData] = await Promise.all([
      users.get({ _id: { $in: grantedIds } }),
      userGroups.get({ _id: { $in: grantedIds } }),
    ]);

    return Object.keys(grantedPermissions).map(id => {
      const differentLevels = grantedPermissions[id].access.filter(unique);
      const level =
        grantedPermissions[id].access.length !== entitiesPermissionsData.length ||
        differentLevels.length > 1
          ? 'mixed'
          : differentLevels[0];
      const sourceData = grantedPermissions[id].permission.type === 'user' ? usersData : groupsData;
      const additional =
        grantedPermissions[id].permission.type === 'user'
          ? (p: any) => ({ label: p.username, role: p.role })
          : (g: any) => ({ label: g.name });
      return {
        ...setAdditionalData(sourceData, grantedPermissions[id].permission, additional),
        level,
      };
    });
  },
};
