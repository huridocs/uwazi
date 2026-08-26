import {
  EntityPermissionChecker,
  PermissionSpec,
} from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';

class MongoEntityPermissionChecker
  extends MongoDataSource<EntityDBO>
  implements EntityPermissionChecker
{
  protected collectionName = 'entities';

  async filterEntities(sharedIds: string[], permissionSpec: PermissionSpec): Promise<string[]> {
    if (sharedIds.length === 0) return [];
    if (permissionSpec.isWriteLevel && permissionSpec.isAnonymous()) return [];

    let match: object = { sharedId: { $in: sharedIds }, published: true };

    if (permissionSpec.isPrivileged()) {
      match = { sharedId: { $in: sharedIds } };
    } else {
      const userRefIds = permissionSpec.refIds;

      if (permissionSpec.isWriteLevel) {
        match = {
          sharedId: { $in: sharedIds },
          permissions: { $elemMatch: { refId: { $in: userRefIds }, level: 'write' } },
        };
      } else {
        match = {
          sharedId: { $in: sharedIds },
          $or: [
            { published: true },
            { permissions: { $elemMatch: { refId: { $in: userRefIds } } } },
          ],
        };
      }
    }

    const entities = await this.getCollection()
      .aggregate([
        { $match: match },
        { $project: { sharedId: 1 } },
        { $group: { _id: '$sharedId', sharedId: { $first: '$sharedId' } } },
      ])
      .toArray();

    return entities.map(entity => entity.sharedId);
  }

  async checkReadPermission(sharedId: string, user: User): Promise<boolean> {
    const [entity] = await this.getCollection()
      .aggregate([
        { $match: { sharedId } },
        {
          $group: {
            _id: '$sharedId',
            sharedId: { $first: '$sharedId' },
            template: { $first: '$template' },
            permissions: { $first: '$permissions' },
            published: { $first: '$published' },
          },
        },
      ])
      .toArray();

    if (!entity) {
      return false;
    }

    if (entity.published || user?.isPrivileged()) {
      return true;
    }

    const userRefIds = [user._id, ...user.groups];
    const userRefIdsAsStrings = userRefIds.map(id => id.toString());
    return Boolean(
      entity.permissions?.some((perm: any) => userRefIdsAsStrings.includes(perm.refId.toString()))
    );
  }

  async checkWritePermission(file: BaseFile, user: User): Promise<boolean> {
    if (user.isAnonymous()) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    if (!file.isEntityFile()) {
      return false;
    }

    const [entity] = await this.getCollection()
      .aggregate([
        { $match: { sharedId: file.entity } },
        {
          $group: {
            _id: '$sharedId',
            sharedId: { $first: '$sharedId' },
            permissions: { $first: '$permissions' },
          },
        },
      ])
      .toArray();

    if (!entity) {
      return false;
    }

    const userRefIds = [user._id, ...user.groups].map(id => id.toString());
    return Boolean(
      entity.permissions?.some(
        (perm: any) => userRefIds.includes(perm.refId.toString()) && perm.level === 'write'
      ) ?? false
    );
  }
}

export { MongoEntityPermissionChecker };
