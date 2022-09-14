import { ObjectId } from 'mongodb';
import { EntityPermissions } from '../model/EntityPermissions';
import { DataBlueprint } from '../validation/dataBlueprint';
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

const entityPermissionsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: { type: 'object' },
    sharedId: { type: 'string' },
    permissions: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              refId: { type: 'object' },
              type: { type: 'string', enum: ['user', 'group'] },
              level: { type: 'string', enum: ['read', 'write'] },
            },
            required: ['refId', 'type', 'level'],
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              refId: { type: 'string', enum: ['public'] },
              type: { type: 'string', enum: ['public'] },
              level: { type: 'string', enum: ['public'] },
            },
            required: ['refId', 'type', 'level'],
          },
        ],
      },
    },
  },
  required: ['sharedId', 'permissions'],
};
const entityPermissionsBlueprint = new DataBlueprint(entityPermissionsSchema);

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
      entityPermissionsBlueprint,
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
