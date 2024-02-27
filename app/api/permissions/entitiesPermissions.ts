import { denormalizePublishedStateInRelated } from 'api/entities/denormalize';
import entities from 'api/entities/entities';
import users from 'api/users/users';
import userGroups from 'api/usergroups/userGroups';
import { unique } from 'api/utils/filters';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import {
  AccessLevels,
  PermissionType,
  MixedAccess,
  validateUniquePermissions,
} from 'shared/types/permissionSchema';
import { PermissionSchema, PermissionsDataSchema } from 'shared/types/permissionType';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { permissionsContext } from './permissionsContext';
import { PUBLIC_PERMISSION } from './publicPermission';

const setAdditionalData = (
  referencedList: { _id: ObjectIdSchema }[],
  permission: PermissionSchema,
  additional: (data: { _id: ObjectIdSchema }) => {}
) => {
  const referencedData = referencedList.find(
    u => u._id!.toString() === permission.refId.toString()
  );
  return referencedData ? { ...permission, ...additional(referencedData) } : undefined;
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
      ...PUBLIC_PERMISSION,
      level: totalEntities === publishedEntities ? AccessLevels.READ : MixedAccess.MIXED,
    });
  }

  return permissionsData.filter(p => p.refId !== undefined);
}

const publishingChanged = (newPublishedValue: boolean, currentEntities: EntitySchema[]) =>
  currentEntities.reduce(
    (changed, entity) => changed || !!entity.published !== newPublishedValue,
    false
  );

const replaceMixedAccess = (entity: EntitySchema, newPermissions: PermissionSchema[]) =>
  newPermissions
    .map(newPermission => {
      if (newPermission.level !== MixedAccess.MIXED) return newPermission;

      return entity.permissions?.find(p => p.refId.toString() === newPermission.refId.toString());
    })
    .filter(p => p);

const getPublishingQuery = (newPublicPermission?: PermissionSchema) => {
  if (newPublicPermission && newPublicPermission.level === MixedAccess.MIXED) return {};

  return { published: !!newPublicPermission };
};

export const entitiesPermissions = {
  set: async (permissionsData: PermissionsDataSchema) => {
    await validateUniquePermissions(permissionsData);

    const user = permissionsContext.getUserInContext();

    const currentEntities: EntityWithFilesSchema[] = await entities.get(
      { sharedId: { $in: permissionsData.ids } },
      { published: 1, permissions: 1 }
    );

    const nonPublicPermissions = permissionsData.permissions.filter(
      p => p.type !== PermissionType.PUBLIC
    );
    const publicPermission = permissionsData.permissions.find(
      p => p.type === PermissionType.PUBLIC
    );

    if (
      !['admin', 'editor'].includes(user!.role) &&
      publicPermission?.level !== MixedAccess.MIXED &&
      publishingChanged(!!publicPermission, currentEntities)
    ) {
      throw new Error('Insuficient permissions to share/unshare publicly');
    }

    const toSave = currentEntities.map(entity => ({
      _id: entity._id,
      permissions: replaceMixedAccess(entity, nonPublicPermissions),
      ...getPublishingQuery(publicPermission),
    }));

    const saved = await entities.saveMultiple(toSave);
    await denormalizePublishedStateInRelated(saved, permissionsData.permissions);
  },

  get: async (sharedIds: string[]) => {
    const entitiesPermissionsData: { permissions: PermissionSchema[]; published: boolean }[] = (
      await entities.get(
        { sharedId: { $in: sharedIds } },
        { permissions: 1, published: 1 },
        { withoutDocuments: true }
      )
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
