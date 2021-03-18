import entities from 'api/entities/entities';
import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { unique } from 'api/utils/filters';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import { EntitySchema } from 'shared/types/entityType';
import {
  AccessLevels,
  PermissionType,
  MixedAccess,
  validateUniquePermissions,
} from 'shared/types/permissionSchema';
import { PermissionSchema } from 'shared/types/permissionType';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { PermissionsDataSchema } from '../../shared/types/permissionType';

const setAdditionalData = (
  peopleList: (GroupMemberSchema | UserGroupSchema)[],
  permission: PermissionSchema,
  additional: (data: GroupMemberSchema | UserGroupSchema) => {}
) => {
  const userData = peopleList.find(u => u._id!.toString() === permission.refId.toString());
  return userData ? { ...permission, ...additional(userData) } : undefined;
};

async function setAccessLevelAndPermissionData(
  grantedPermissions: { [p: string]: { permission: PermissionSchema; access: AccessLevels[] } },
  entitiesPermissionsData: { permissions: PermissionSchema[] | undefined; published: boolean }[],
  publishedData: boolean[]
) {
  const grantedIds = Object.keys(grantedPermissions);
  const [usersData, groupsData] = await Promise.all([
    users.get({ _id: { $in: grantedIds } }),
    userGroups.get({ _id: { $in: grantedIds } }),
  ]);

  const permissionsData = Object.keys(grantedPermissions).map(id => {
    const differentLevels = grantedPermissions[id].access.filter(unique);
    const level =
      grantedPermissions[id].access.length !== entitiesPermissionsData.length ||
      differentLevels.length > 1
        ? MixedAccess.MIXED
        : differentLevels[0];
    const sourceData =
      grantedPermissions[id].permission.type === PermissionType.USER ? usersData : groupsData;
    const additional =
      grantedPermissions[id].permission.type.toString() === PermissionType.USER
        ? (p: any) => ({ label: p.username })
        : (g: any) => ({ label: g.name });
    return {
      ...setAdditionalData(sourceData, grantedPermissions[id].permission, additional),
      level,
    } as MemberWithPermission;
  });

  const publishedEntities = publishedData.filter(published => published).length;
  const totalEntities = publishedData.length;

  if (publishedEntities) {
    permissionsData.push({
      refId: 'public',
      type: 'public',
      label: 'Public',
      level: totalEntities === publishedEntities ? AccessLevels.READ : MixedAccess.MIXED,
    });
  }

  return permissionsData.filter(p => p.refId !== undefined);
}

export const entitiesPermissions = {
  set: async (permissionsData: PermissionsDataSchema) => {
    await validateUniquePermissions(permissionsData);
    const currentEntities = await entities.get(
      { sharedId: { $in: permissionsData.ids } },
      '_id,+permissions'
    );

    const nonPublicPermissions = permissionsData.permissions.filter(p => p.type !== 'public');
    const published = permissionsData.permissions.findIndex(p => p.type === 'public') > -1;

    const toSave = currentEntities.map(entity => ({
      _id: entity._id,
      permissions: nonPublicPermissions,
      published,
    }));
    await entities.saveMultiple(toSave);
  },

  get: async (sharedIds: string[]) => {
    const entitiesPermissionsData = (
      await entities.get({ sharedId: { $in: sharedIds } }, { permissions: 1, published: 1 })
    ).map((entity: EntitySchema) => ({
      permissions: entity.permissions || [],
      published: !!entity.published,
    }));

    const grantedPermissions: {
      [k: string]: { permission: PermissionSchema; access: AccessLevels[] };
    } = {};

    const publishedStatuses: boolean[] = [];

    entitiesPermissionsData.forEach(entityPermissions => {
      entityPermissions.permissions.forEach(permission => {
        const grantedPermission = grantedPermissions[permission.refId.toString()];

        if (grantedPermission) {
          grantedPermission.access.push(permission.level as AccessLevels);
        } else {
          grantedPermissions[permission.refId.toString()] = {
            permission,
            access: [permission.level as AccessLevels],
          };
        }
      });

      publishedStatuses.push(entityPermissions.published);
    });

    const permissions: MemberWithPermission[] = await setAccessLevelAndPermissionData(
      grantedPermissions,
      entitiesPermissionsData,
      publishedStatuses
    );

    return permissions.sort((a: MemberWithPermission, b: MemberWithPermission) =>
      (a.type + a.label).localeCompare(b.type + b.label)
    );
  },
};
