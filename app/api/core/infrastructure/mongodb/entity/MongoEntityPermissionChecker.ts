import {
  EntityPermissionChecker,
  Specification,
} from 'api/core/domain/entity/EntityPermissionChecker';
import { Result, ResultType } from 'api/core/libs/Result';
import { User } from 'api/users.v2/model/User';
import { MongoEntityDAO } from './MongoEntityDAO';
import { BaseFile } from 'api/core/domain/files/BaseFile';

class MongoEntityPermissionChecker extends MongoEntityDAO implements EntityPermissionChecker {
  async filterEntities(
    sharedIds: string[],
    specification: Specification
  ): Promise<ResultType<string[], Error>> {
    const entities = await this.getCollection()
      .aggregate([
        { $match: { sharedId: { $in: sharedIds } } },
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

    if (entities.length === 0) {
      return Result.fail(new Error(`Entities not found: ${sharedIds.join(', ')}`));
    }

    if (specification.isPrivileged) {
      return Result.ok(entities.map(entity => entity.sharedId));
    }

    const userRefIds = [specification.actor._id, ...specification.actor.groups];
    const userRefIdsAsStrings = userRefIds.map(id => id.toString());

    const grantedEntities = entities
      .filter(entity => {
        if (specification.isWriteLevel) {
          return entity.permissions?.some(
            (perm: any) =>
              userRefIdsAsStrings.includes(perm.refId.toString()) &&
              specification.isSatisfiedBy(perm.level)
          );
        }

        return (
          entity.published ||
          entity.permissions?.some((perm: any) =>
            userRefIdsAsStrings.includes(perm.refId.toString())
          )
        );
      })
      .map(entity => entity.sharedId);

    if (grantedEntities.length === 0) {
      return Result.fail(
        new Error(
          `You do not have permission to any of the requested entities: ${sharedIds.join(', ')}`
        )
      );
    }

    return Result.ok(grantedEntities);
  }

  async checkReadPermission(sharedId: string, user?: User): Promise<ResultType<boolean, Error>> {
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

    if (user) {
      const userRefIds = [user._id, ...user.groups];
      const userRefIdsAsStrings = userRefIds.map(id => id.toString());
      return Result.ok(
        entity.permissions?.some((perm: any) => userRefIdsAsStrings.includes(perm.refId.toString()))
      );
    }
    return Result.ok(false);
  }

  async checkWritePermission(file: BaseFile, user?: User): Promise<ResultType<boolean, Error>> {
    if (!user) {
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
