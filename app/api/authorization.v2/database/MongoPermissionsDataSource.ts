import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { PermissionsDataSource } from '../contracts/PermissionsDataSource';
import { EntityPermissions } from '../model/EntityPermissions';
import {
  PermissionType,
  RestrictedPermissionType,
  EntityPermissionsDBOType,
} from './schemas/permissionTypes';

const isRestricted = (entry: PermissionType): entry is RestrictedPermissionType =>
  entry.refId !== 'public';

export class MongoPermissionsDataSource
  extends MongoDataSource<EntityPermissionsDBOType>
  implements PermissionsDataSource
{ // eslint-disable-line
  protected collectionName = 'entities';

  getByEntities(sharedIds: string[]) {
    const cursor = this.getCollection().find(
      { sharedId: { $in: sharedIds } },
      { projection: { sharedId: 1, permissions: 1 } }
    );
    return new MongoResultSet(
      cursor,
      entityPermission =>
        new EntityPermissions(
          entityPermission.sharedId,
          entityPermission.permissions?.map(entry =>
            isRestricted(entry)
              ? {
                  ...entry,
                  refId:
                    typeof entry.refId === 'string'
                      ? entry.refId
                      : MongoIdHandler.mapToApp(entry.refId),
                }
              : entry
          ) ?? []
        )
    );
  }
}
