import { EntityPermissions } from '../model/EntityPermissions';
import { MongoDataSource } from './MongoDataSource';
import { MongoResultSet } from './MongoResultSet';
import { validateEntityPermissionsDBO } from './typing/permissionSchemas';
import {
  EntityPermissionsDBOType,
  RestrictedPermissionType,
  PermissionType,
} from './typing/permissionTypes';

const isRestricted = (entry: PermissionType): entry is RestrictedPermissionType =>
  entry.refId !== 'public';

export class PermissionsDataSource extends MongoDataSource {
  getByEntities(sharedIds: string[]) {
    const cursor = this.db
      .collection<EntityPermissionsDBOType>('entities')
      .find(
        { sharedId: { $in: sharedIds } },
        { projection: { sharedId: 1, permissions: 1 }, session: this.session }
      );
    return new MongoResultSet(
      cursor,
      validateEntityPermissionsDBO,
      entityPermission =>
        new EntityPermissions(
          entityPermission.sharedId,
          entityPermission.permissions?.map(entry =>
            isRestricted(entry)
              ? {
                  ...entry,
                  refId: entry.refId.toHexString(),
                }
              : entry
          ) ?? []
        )
    );
  }
}
