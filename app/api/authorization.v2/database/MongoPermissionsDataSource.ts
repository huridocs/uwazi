import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { PermissionsDataSource } from '../contracts/PermissionsDataSource';
import { EntityPermissions } from '../model/EntityPermissions';
import { EntityPermissionsDBO } from './schemas/permissionTypes';

const mapPermissions = (entityPermissionInfo: EntityPermissionsDBO) => {
  const entries =
    entityPermissionInfo.permissions?.map(entry => ({
      ...entry,
      refId: typeof entry.refId === 'string' ? entry.refId : MongoIdHandler.mapToApp(entry.refId),
    })) ?? [];
  return new EntityPermissions(
    entityPermissionInfo.sharedId,
    entries,
    entityPermissionInfo.published || false
  );
};
export class MongoPermissionsDataSource
  extends MongoDataSource<EntityPermissionsDBO>
  implements PermissionsDataSource
{ // eslint-disable-line
  protected collectionName = 'entities';

  getByEntities(sharedIds: string[]) {
    const cursor = this.getCollection().find(
      { sharedId: { $in: sharedIds } },
      { projection: { sharedId: 1, permissions: 1, published: 1 } }
    );
    return new MongoResultSet(cursor, mapPermissions);
  }
}
