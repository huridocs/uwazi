import { Db, Document, Filter, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { applyScope, resolveProjection } from './UserReadOptions.js';
import type { ReadOptions, UserScope } from './UserReadOptions.js';

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
};

type UserWithGroupsDBO = UserDBO & { groups: { _id: string; name: string }[] };

/**
 * A private building block, not an interface (D4). Only UsersDataSource, UsersDirectory and
 * UsersQueryService may hold one; an eslint fence enforces that.
 *
 * Two invariants make this safe to use without reading it:
 *   - every read applies the same guards, via `scoped()` (D5)
 *   - every read projects the same named field groups, defaulting to `identity` (D6)
 *
 * It returns raw nullable rows and never a `Result` — absence is not a domain error down
 * here, and wrapping it is the adapter's job.
 */
class MongoUsersDAO extends MongoDataSource<UserDBO> {
  protected collectionName = 'users';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  // eslint-disable-next-line class-methods-use-this
  private scoped(filter: Filter<UserDBO>, scope?: UserScope): Filter<UserDBO> {
    return applyScope(filter, scope);
  }

  async findOne(filter: Filter<UserDBO>, options: ReadOptions = {}): Promise<UserDBO | null> {
    return this.getCollection<UserDBO>().findOne(this.scoped(filter, options.scope), {
      projection: resolveProjection(options.fields),
    });
  }

  async findMany(filter: Filter<UserDBO> = {}, options: ReadOptions = {}): Promise<UserDBO[]> {
    return this.getCollection<UserDBO>()
      .find(this.scoped(filter, options.scope), { projection: resolveProjection(options.fields) })
      .toArray();
  }

  /**
   * The users<->usergroups join, server-side (D7). Lives here rather than in the query
   * service because once both backends join in the database the join is a persistence
   * concern — and because keeping it here lets the guards come from `scoped()` instead of
   * being injected from outside.
   */
  async findWithGroups(
    filter: Filter<UserDBO> = {},
    options: ReadOptions = {}
  ): Promise<UserWithGroupsDBO[]> {
    const aggregation = [
      { $match: this.scoped(filter, options.scope) },
      { $project: resolveProjection(options.fields) },
      {
        $lookup: {
          from: 'usergroups',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $in: ['$$userId', '$members.refId'] } } },
            { $project: { _id: { $toString: '$_id' }, name: 1 } },
          ],
          as: 'groups',
        },
      },
    ];

    return this.getCollection().aggregate<UserWithGroupsDBO>(aggregation).toArray();
  }

  async exists(filter: Filter<UserDBO>, options: ReadOptions = {}): Promise<boolean> {
    const user = await this.getCollection<UserDBO>().findOne(this.scoped(filter, options.scope), {
      projection: { _id: 1 },
    });

    return Boolean(user);
  }

  async count(filter: Filter<UserDBO> = {}, options: ReadOptions = {}): Promise<number> {
    return this.getCollection<UserDBO>().countDocuments(
      this.scoped(filter, options.scope) as Document
    );
  }

  async insertOne(dbo: UserDBO): Promise<void> {
    await this.getCollection<UserDBO>().insertOne(dbo);
  }

  async updateOne(
    filter: Filter<UserDBO>,
    update: UpdateFilter<UserDBO> | Partial<UserDBO>,
    options: { scope?: UserScope } = {}
  ): Promise<void> {
    await this.getCollection<UserDBO>().updateOne(this.scoped(filter, options.scope), update);
  }

  /**
   * Guarded like the reads. It is a write, but the system-user guard matters most here:
   * the previous implementation guarded nothing at all.
   */
  async softDelete(ids: string[], options: { scope?: UserScope } = {}): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const result = await this.getCollection<UserDBO>().updateMany(
      this.scoped({ _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } }, options.scope),
      { $set: { deletedAt: new Date() } }
    );

    return result.modifiedCount;
  }

  /* ------------------------------------------------------------------------------------
   * Legacy surface — removed in plan 05.
   *
   * These exist only so the call sites in `app/api/**` that plan 05 migrates to
   * UsersDirectory keep working meanwhile (activitylog/helpers.js, entitiesPermissions.ts,
   * userGroups.ts, users.js, the two email job handlers). Plan 02 must not touch those
   * files, and D11 requires the old path to stay live until parity is proven in plan 04.
   *
   * Do not call these from new code, and do not extend them. `getById` returning a
   * `Result` is exactly the business-in-infrastructure leak D4 removes; it survives here
   * only because `users.js` and the job handlers currently unwrap one.
   * ---------------------------------------------------------------------------------- */

  /** @deprecated use `findOne` and wrap absence in the adapter. Removed in plan 05. */
  async getById(
    id: string,
    options: { includePassword?: boolean; includeDeleted?: boolean } = {}
  ): Promise<ResultType<UserDBO, UserNotFound>> {
    const user = await this.findOne(
      { _id: ObjectId.createFromHexString(id) },
      {
        fields: options.includePassword
          ? ['identity', 'status', 'credentials']
          : ['identity', 'status'],
        scope: { deleted: options.includeDeleted ? 'include' : 'exclude' },
      }
    );

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(user);
  }

  /** @deprecated use `findMany({ _id: { $in: ... } })`. Removed in plan 05. */
  async findByIds(ids: string[]): Promise<UserDBO[]> {
    if (!ids.length) {
      return [];
    }

    return this.findMany(
      { _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } },
      { fields: ['identity', 'status'] }
    );
  }
}

export { MongoUsersDAO };
export type { UserWithGroupsDBO };
