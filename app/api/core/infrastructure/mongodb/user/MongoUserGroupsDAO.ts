import { Db, type Document, type Filter, type FindOptions } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserGroupDBO } from './UserGroupDBO.js';

/**
 * A generic building block over the usergroups collection: the session-scoped collection
 * handle and DBO typing, nothing else. It returns DBOs and knows no read model.
 *
 * There are no intent-named methods here on purpose. User groups have no guard to enforce —
 * no soft delete, no system-group analogue of PUBLIC_USER_ID — so a read vocabulary would be
 * an abstraction expressing nothing. What this shape buys is a single seam: if a guard ever
 * appears, `find` and `aggregate` are overridden here and every read inherits it, instead of
 * a rule having to be threaded through N intent methods.
 *
 * Query construction lives one level up, in MongoUserGroupsDirectory and
 * MongoUserGroupsQueryService — still inside infrastructure/mongodb, so Mongo query language
 * never leaves this backend.
 */
class MongoUserGroupsDAO extends MongoDataSource<UserGroupDBO> {
  protected collectionName = 'usergroups';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  async find(filter: Filter<UserGroupDBO>, options?: FindOptions): Promise<UserGroupDBO[]> {
    return this.getCollection().find(filter, options).toArray();
  }

  async aggregate<T extends Document>(pipeline: Document[]): Promise<T[]> {
    return this.getCollection().aggregate<T>(pipeline).toArray();
  }
}

export { MongoUserGroupsDAO };
