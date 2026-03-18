import {
  EntityPermissionChecker,
  Specification,
} from '#api/core/domain/entity/EntityPermissionChecker.js';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { User } from '#api/users.v2/model/User.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';

class MongoEntityPermissionChecker
  extends MongoDataSource<EntityDBO>
  implements EntityPermissionChecker
{
  protected collectionName = 'entities';

  async filterEntities(sharedIds: string[], specification: Specification): Promise<string[]> {
    if (sharedIds.length === 0) return [];
    if (specification.isWriteLevel && specification.actor.isAnonymous()) return [];

    let match: object = { sharedId: { $in: sharedIds }, published: true };

    if (specification.isPrivileged) {
      match = { sharedId: { $in: sharedIds } };
    } else {
      const userRefIds = [specification.actor._id, ...specification.actor.groups];

      if (specification.isWriteLevel) {
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

  async checkReadPermission(sharedId: string, user: User): Promise<ResultType<boolean, Error>> {
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
      return Result.fail(new Error(`Entity not found: ${sharedId}`));
    }

    if (entity.published || user?.isPrivileged()) {
      return Result.ok(true);
    }

    const userRefIds = [user._id, ...user.groups];
    const userRefIdsAsStrings = userRefIds.map(id => id.toString());
    return Result.ok(
      entity.permissions?.some((perm: any) => userRefIdsAsStrings.includes(perm.refId.toString()))
    );
  }

  async checkWritePermission(file: BaseFile, user: User): Promise<ResultType<boolean, Error>> {
    if (user.isAnonymous()) {
      return Result.ok(false);
    }
    if (user.isPrivileged()) {
      return Result.ok(true);
    }

    if (file.isEntityFile()) {
      const [entity] = await this.getCollection()
        .aggregate([
          { $match: { sharedId: file.entity } },
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

      // groups not tested
      const userRefIds = [user._id, ...user.groups];
      //
      const userRefIdsAsStrings = userRefIds.map(id => id.toString());
      return Result.ok(
        entity.permissions?.some((perm: any) => userRefIdsAsStrings.includes(perm.refId.toString()))
      );
    }
    return Result.ok(true);
  }
}

export { MongoEntityPermissionChecker };
