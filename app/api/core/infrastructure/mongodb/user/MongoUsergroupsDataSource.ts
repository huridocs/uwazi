import { Db, ObjectId } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { User } from '#api/core/domain/user/User.js';
import { UsergroupsDataSource } from '#api/core/application/contracts/UsergroupsDataSource.js';
import { UserGroupDBO } from './UserGroupDBO.js';

class MongoUsergroupsDataSource
  extends MongoDataSource<UserGroupDBO>
  implements UsergroupsDataSource
{
  protected collectionName = 'usergroups';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  async getUserGroups(user: User): Promise<User['groups']> {
    const collection = this.getCollection();
    const groupDocuments = await collection.find({ 'members.refId': user._id }).toArray();
    return groupDocuments.map(group => ({
      _id: group._id.toString(),
      name: group.name,
    }));
  }

  async updateUserGroups(user: User): Promise<void> {
    const targetGroupIds = user.groups.map(group => ObjectId.createFromHexString(group._id));

    const collection = this.getCollection();

    if (targetGroupIds.length > 0) {
      await collection.updateMany(
        { _id: { $in: targetGroupIds } },
        { $addToSet: { members: { refId: user._id } } }
      );
    }

    await collection.updateMany(
      { _id: { $nin: targetGroupIds }, 'members.refId': user._id },
      { $pull: { members: { refId: user._id } } }
    );
  }

  async removeUsersFromGroups(userIds: string[]): Promise<void> {
    const collection = this.getCollection();
    await collection.updateMany({}, { $pull: { members: { refId: { $in: userIds } } } });
  }
}

export { MongoUsergroupsDataSource };
