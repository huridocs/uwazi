import { Db, Document, Filter, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { applyScope, resolveProjection } from './UserReadOptions.js';
import type { ReadOptions, UserScope } from './UserReadOptions.js';

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
};

type UserWithGroupsDBO = UserDBO & { groups: { _id: string; name: string }[] };

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

  async countByRole(options: { scope?: UserScope } = {}): Promise<Record<string, number>> {
    const rows = await this.getCollection<UserDBO>()
      .aggregate<{ _id: string; count: number }>([
        { $match: this.scoped({}, options.scope) as Document },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ])
      .toArray();

    return Object.fromEntries(rows.map(row => [row._id, row.count]));
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

  async delete(ids: string[], options: { scope?: UserScope } = {}): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const result = await this.getCollection<UserDBO>().updateMany(
      this.scoped({ _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } }, options.scope),
      { $set: { deletedAt: new Date() } }
    );

    return result.modifiedCount;
  }
}

export { MongoUsersDAO };
export type { UserWithGroupsDBO };
