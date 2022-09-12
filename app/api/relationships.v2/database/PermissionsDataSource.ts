import { ObjectId } from 'mongodb';
import { EntityPermissions } from '../model/EntityPermissions';
import { MongoDataSource } from './MongoDataSource';
import { MongoResultSet } from './MongoResultSet';

interface EntityPermissionsDBO {
  sharedId: string;
  permissions?: (
    | {
        refId: ObjectId;
        type: 'user' | 'group';
        level: 'read' | 'write';
      }
    | {
        refId: 'public';
        type: 'public';
        level: 'public';
      }
  )[];
}

export class PermissionsDataSource extends MongoDataSource {
  getByEntities(sharedIds: string[]) {
    const cursor = this.db
      .collection<EntityPermissionsDBO>('entities')
      .find(
        { sharedId: { $in: sharedIds } },
        { projection: { sharedId: 1, permissions: 1 }, session: this.session }
      );
    return new MongoResultSet(
      cursor,
      entityPermission =>
        new EntityPermissions(
          entityPermission.sharedId,
          entityPermission.permissions?.map(entry =>
            entry.refId === 'public'
              ? entry
              : {
                  ...entry,
                  refId: entry.refId.toHexString(),
                }
          ) ?? []
        )
    );
  }
}
