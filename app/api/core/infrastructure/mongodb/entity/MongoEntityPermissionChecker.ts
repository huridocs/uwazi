import {
  EntityPermissionChecker,
  Specification,
} from 'api/core/domain/entity/EntityPermissionChecker';
import { AccessLevel } from 'api/core/domain/entity/AccessLevel';
import { Result, ResultType } from 'api/core/libs/Result';
import { MongoEntityDAO } from './MongoEntityDAO';

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

    const grantedSharedIds = entities
      .filter(entity => {
        if (specification.level === AccessLevel.Write) {
          return entity.permissions?.some(
            (perm: any) =>
              userRefIdsAsStrings.includes(perm.refId.toString()) &&
              perm.level === AccessLevel.Write
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

    if (grantedSharedIds.length === 0) {
      return Result.fail(
        new Error(
          `You do not have permission to any of the requested entities: ${sharedIds.join(', ')}`
        )
      );
    }

    return Result.ok(grantedSharedIds);
  }
}

export { MongoEntityPermissionChecker };
