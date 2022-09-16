import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { EntityPermissions } from '../model/EntityPermissions';
import { validateEntityPermissionsDBO } from './schemas/permissionSchemas';
import {
  PermissionType,
  RestrictedPermissionType,
  EntityPermissionsDBOType,
} from './schemas/permissionTypes';

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
