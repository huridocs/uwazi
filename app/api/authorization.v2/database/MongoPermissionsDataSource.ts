import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { PermissionsDataSource } from '../contracts/PermissionsDataSource.js';
import { EntityPermissions } from '../model/EntityPermissions.js';
import { EntityPermissionsDBO } from './schemas/permissionTypes.js';

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
{
  // eslint-disable-line
  protected collectionName = 'entities';

  getByEntities(sharedIds: string[]) {
    const cursor = this.getCollection().find(
      { sharedId: { $in: sharedIds } },
      { projection: { sharedId: 1, permissions: 1, published: 1 } }
    );
    return new MongoResultSet(cursor, mapPermissions);
  }
}
